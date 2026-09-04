import { Router, Request, Response } from 'express';
import {
    getOrganization, getFullHierarchy, getLatestTelemetry, getTelemetryLog,
    findCampusById, findBuildingById, getRecommendations, updateAlertStatus,
    getActiveContext, setActiveContext, writeAuditLog
} from '../db';
import { processTelemetryIngestion, TelemetryData } from '../eventEngine';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { validateBody, TelemetryIngestSchema, SimulateScenarioSchema, UpdateAlertSchema } from '../middleware/validation';

const router = Router();
router.use(requireAuth as any);

router.get('/campuses', async (req: Request, res: Response) => {
    const [organization, campuses] = await Promise.all([getOrganization(), getFullHierarchy()]);
    return res.json({ organization, campuses });
});

router.get('/telemetry', async (req: Request, res: Response) => {
    return res.json(await getLatestTelemetry());
});

router.post('/telemetry-ingest', validateBody(TelemetryIngestSchema), async (req: Request, res: Response) => {
    const telemetry: TelemetryData = req.body;
    await processTelemetryIngestion(telemetry);
    const [telemetryNow, activeContext] = await Promise.all([getLatestTelemetry(), getActiveContext()]);
    return res.json({ status: 'success', telemetry: telemetryNow, activeContext });
});

router.get('/ghost-generation', async (req: Request, res: Response) => {
    const { campusId, rooftopId, days } = req.query;
    const camp = await findCampusById(campusId as string);
    const roof = await findBuildingById(rooftopId as string);
    const numDays = parseInt(days as string) || 30;

    const mlServiceUrl = process.env.ML_SERVICE_URL
        ? `https://${process.env.ML_SERVICE_URL}`
        : 'http://localhost:8000';

    const assetConfig = {
        asset_id: roof.id || 'roof-1',
        latitude: camp.lat || 23.18,
        longitude: camp.lng || 79.98,
        capacity_kwp: camp.size || 500.0,
        tilt_deg: roof.tilt || 20.0,
        azimuth_deg: 180.0,
        temperature_coefficient: -0.0035,
        inverter_efficiency: 0.96
    };

    const totalHours = numDays * 24;
    const sampleCount = totalHours * 4;
    const weatherWindow = Array.from({ length: sampleCount }).map((_, idx) => {
        const hourOfDay = (idx * 0.25) % 24;
        const isDaytime = hourOfDay >= 6 && hourOfDay <= 18;
        const sunAngle = isDaytime ? Math.sin((hourOfDay - 6) * Math.PI / 12) : 0;
        const ghi = isDaytime ? Math.floor(sunAngle * 950) : 0;
        return {
            ghi, dni: Math.floor(ghi * 0.75), dhi: Math.floor(ghi * 0.25),
            temp_air: 28.0 + (isDaytime ? sunAngle * 7 : -3), wind_speed: 2.5
        };
    });

    let expected = 0;
    try {
        const response = await fetch(`${mlServiceUrl}/physics/expected-power`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ asset_config: assetConfig, weather_window: weatherWindow })
        });
        if (response.ok) {
            const data: any = await response.json();
            expected = Math.floor(data.total_expected_kwh || 0);
        } else {
            expected = Math.floor(assetConfig.capacity_kwp * 4.0 * numDays * 0.95);
        }
    } catch (err) {
        expected = Math.floor(assetConfig.capacity_kwp * 4.0 * numDays * 0.95);
    }

    const loggedHistory = await getTelemetryLog();
    const dataCompletenessPct = Number(Math.min(100, (loggedHistory.length / Math.max(1, sampleCount)) * 100).toFixed(1));

    const efficiencyDrop = roof.efficiencyDrop || 0.12;
    const actual = Math.floor(expected * (1 - efficiencyDrop));
    const ghost = Math.max(0, expected - actual);
    const revenue = Math.floor(ghost * (camp.rate || 7.8));
    const carbon = Number(((ghost * 0.71) / 1000).toFixed(2));
    const pr = expected > 0 ? Number(((actual / expected) * 100).toFixed(1)) : 82.5;

    return res.json({ expected, actual, ghost, revenue, carbon, pr, dataCompletenessPct });
});

// Real 7-day weather forecast from Open-Meteo (Task A)
router.get('/forecast', async (req: Request, res: Response) => {
    const camp = await findCampusById();
    const lat = camp?.lat || 23.18;
    const lng = camp?.lng || 79.98;
    const capacityKwp = camp?.size || 138;

    const mapWeatherCode = (code: number): string => {
        if (code === 0) return 'sunny';
        if (code <= 2) return 'mostly_sunny';
        if (code <= 48) return 'cloudy';
        if (code <= 67 || (code >= 80 && code <= 82)) return 'rainy';
        return 'monsoon';
    };

    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weathercode,shortwave_radiation_sum,precipitation_probability_max&timezone=Asia%2FKolkata&forecast_days=7`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Open-Meteo request failed');
        const data: any = await response.json();

        const forecast = data.daily.time.map((dateString: string, idx: number) => {
            const radiationMJ = data.daily.shortwave_radiation_sum[idx] || 0;
            const avgIrradiance = (radiationMJ * 1_000_000) / (24 * 3600); // MJ/m² → avg W/m²
            const predictedKwVal = (avgIrradiance / 1000) * capacityKwp;
            return {
                date: dateString,
                conditions: mapWeatherCode(data.daily.weathercode[idx]),
                predictedProduction: Math.floor(predictedKwVal),
                expectedRevenue: Math.floor(predictedKwVal * 7.8),
                carbonOffset: Number(((predictedKwVal * 0.71) / 1000).toFixed(2)),
                rainProbability: data.daily.precipitation_probability_max[idx]
            };
        });

        return res.json(forecast);
    } catch (err) {
        console.warn('[FORECAST] Open-Meteo unreachable, using fallback estimate');
        const forecast = Array.from({ length: 7 }).map((_, idx) => {
            const date = new Date();
            date.setDate(date.getDate() + idx);
            const predictedKwVal = capacityKwp * 0.6;
            return {
                date: date.toISOString().split('T')[0],
                conditions: 'unknown',
                predictedProduction: Math.floor(predictedKwVal),
                expectedRevenue: Math.floor(predictedKwVal * 7.8),
                carbonOffset: Number(((predictedKwVal * 0.71) / 1000).toFixed(2))
            };
        });
        return res.json(forecast);
    }
});

router.post('/simulate', requireRole('Operator', 'Administrator', 'Manager') as any, validateBody(SimulateScenarioSchema), async (req: Request, res: Response) => {
    const { inverterFailure, dustAccumulation, batteryDegradation, delayedMaintenance, monsoonEvent, cloudCover } = req.body;

    const baseOutput = 138;
    let deficit = 0;
    deficit += inverterFailure ? 40 : 0;
    deficit += dustAccumulation * 0.28;
    deficit += batteryDegradation * 0.12;
    deficit += cloudCover * 0.52;
    deficit += monsoonEvent ? 22 : 0;

    const maintenanceMultiplier =
        delayedMaintenance === '3m' ? 0.18 : delayedMaintenance === '1m' ? 0.10 : delayedMaintenance === '1w' ? 0.04 : 0;

    deficit += baseOutput * maintenanceMultiplier;
    const energyLost = Math.min(baseOutput, Math.floor(deficit));
    const actual = baseOutput - energyLost;
    const revenueLoss = energyLost * 7.8;
    const carbonLost = Number(((energyLost * 0.71) / 1000).toFixed(3));
    const esgScore = Math.max(10, Math.floor(92 - (energyLost * 0.4)));

    const scenarioContext = {
        trigger: 'scenario-api',
        assetId: 'Scenario Simulator',
        what: `Telemetry stress simulation triggered: ${inverterFailure ? 'Inverter Fail, ' : ''}Cloud Cover ${cloudCover}%, Dust ${dustAccumulation}%.`,
        why: `Simulated parameters model severe environmental/hardware restrictions.`,
        whatNext: `Casacading yield degradation. State of charge drops globally.`,
        action: inverterFailure ? 'Issue immediate work ticket to exchange Inverter 02.' : 'Configure dry-wash optimization parameters.',
        doNothing: `Simulation projects cumulative loss of ₹${Math.floor(revenueLoss * 30)}/month if parameters stabilize at this rate.`,
        financialDelta: -Math.floor(revenueLoss),
        carbonDelta: -carbonLost,
        confidence: 91,
        severity: energyLost > 50 ? 'critical' : energyLost > 20 ? 'warning' : ('info' as any)
    };

    await setActiveContext(scenarioContext);

    return res.json({ energyLost, actual, revenueLoss, carbonLost, esgScore, activeContext: scenarioContext });
});

router.get('/recommendations', async (req: Request, res: Response) => {
    return res.json(await getRecommendations());
});

router.post('/alerts', requireRole('Operator', 'Administrator', 'Manager') as any, validateBody(UpdateAlertSchema), async (req: AuthenticatedRequest, res: Response) => {
    const { alertId, status } = req.body;
    const updatedAlert = await updateAlertStatus(alertId, status);
    if (!updatedAlert) {
        return res.status(404).json({ error: 'Alert not found' });
    }
    await writeAuditLog(req.user!.id, 'ALERT_UPDATE', `Alert ${alertId} updated to ${status}`);
    return res.json(updatedAlert);
});

export default router;
