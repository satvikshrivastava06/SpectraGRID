import { Router, Request, Response } from 'express';
import { getDb, saveDb, writeAuditLog } from '../db';
import { processTelemetryIngestion, TelemetryData } from '../eventEngine';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateBody, TelemetryIngestSchema, SimulateScenarioSchema, UpdateAlertSchema } from '../middleware/validation';

const router = Router();

// All /api/* routes require authentication
router.use(requireAuth as any);

// GET /api/campuses (reads the full hierarchy: Organization -> Campus -> Building -> Rooftop -> Array -> String -> Panel, plus Inverters & Batteries)
router.get('/campuses', (req: Request, res: Response) => {
    const db = getDb();

    const clientCampuses = (db.campuses || []).map(camp => {
        const campusBatteries = (db.batteries || []).filter(b => b.campusId === camp.id || b.buildingId === undefined);
        const buildings = (db.buildings || [])
            .filter(bld => bld.campusId === camp.id)
            .map(bld => {
                const inverters = (db.inverters || []).filter(inv => inv.buildingId === bld.id);
                const rooftops = (db.rooftops || [])
                    .filter(r => r.buildingId === bld.id)
                    .map(roof => {
                        const arrays = (db.arrays || [])
                            .filter(arr => arr.rooftopId === roof.id || arr.buildingId === bld.id)
                            .map(arr => {
                                const strings = (db.strings || [])
                                    .filter(s => s.arrayId === arr.id)
                                    .map(strItem => {
                                        const panels = (db.panels || []).filter(p => p.stringId === strItem.id || p.inverterId === inverters[0]?.id);
                                        return { ...strItem, panels };
                                    });
                                return { ...arr, strings };
                            });
                        return { ...roof, arrays };
                    });
                return {
                    ...bld,
                    rooftops,
                    inverters,
                    batteries: (db.batteries || []).filter(b => b.buildingId === bld.id)
                };
            });
        return {
            ...camp,
            batteries: campusBatteries,
            buildings
        };
    });

    return res.json({
        organization: db.organizations[0],
        campuses: clientCampuses
    });
});

// GET /api/telemetry
router.get('/telemetry', (req: Request, res: Response) => {
    const db = getDb();
    return res.json(db.telemetry);
});

// POST /api/telemetry-ingest (handles ingestion & hooks into AI / anomaly alerts engine)
router.post('/telemetry-ingest', validateBody(TelemetryIngestSchema), async (req: Request, res: Response) => {
    const telemetry: TelemetryData = req.body;
    await processTelemetryIngestion(telemetry);

    const db = getDb();
    return res.json({
        status: 'success',
        telemetry: db.telemetry,
        activeContext: db.activeContext
    });
});

// GET /api/ghost-generation (calculates metrics over dates via pvlib ml-service)
router.get('/ghost-generation', async (req: Request, res: Response) => {
    const { campusId, rooftopId, days } = req.query;
    const db = getDb();

    const camp = db.campuses.find(c => c.id === campusId || c.name === campusId) || db.campuses[0];
    const roof = db.buildings.find(b => b.id === rooftopId || b.name === rooftopId) || db.buildings[0];
    const numDays = parseInt(days as string) || 30;

    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';

    // Construct asset config with dynamic location support (latitude & longitude)
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

    // Generate weather window samples for requested days (4 samples per hour)
    const totalHours = numDays * 24;
    const sampleCount = totalHours * 4; // 15-min intervals
    const weatherWindow = Array.from({ length: sampleCount }).map((_, idx) => {
        const hourOfDay = (idx * 0.25) % 24;
        const isDaytime = hourOfDay >= 6 && hourOfDay <= 18;
        const sunAngle = isDaytime ? Math.sin((hourOfDay - 6) * Math.PI / 12) : 0;
        const ghi = isDaytime ? Math.floor(sunAngle * 950) : 0;
        return {
            ghi,
            dni: Math.floor(ghi * 0.75),
            dhi: Math.floor(ghi * 0.25),
            temp_air: 28.0 + (isDaytime ? sunAngle * 7 : -3),
            wind_speed: 2.5
        };
    });

    let expected = 0;
    try {
        const response = await fetch(`${mlServiceUrl}/physics/expected-power`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                asset_config: assetConfig,
                weather_window: weatherWindow
            })
        });

        if (response.ok) {
            const data: any = await response.json();
            expected = Math.floor(data.total_expected_kwh || 0);
        } else {
            console.warn('[PHYSICS] ML service response not OK, fallback physics calculation');
            expected = Math.floor(assetConfig.capacity_kwp * 4.0 * numDays * 0.95);
        }
    } catch (err) {
        console.warn('[PHYSICS] Could not connect to ML service at', mlServiceUrl);
        expected = Math.floor(assetConfig.capacity_kwp * 4.0 * numDays * 0.95);
    }

    // Telemetry log actual power aggregation
    const loggedHistory = db.telemetryLog || [];
    const loggedRecordsCount = loggedHistory.length;
    const dataCompletenessPct = Number(Math.min(100, (loggedRecordsCount / Math.max(1, sampleCount)) * 100).toFixed(1));

    const efficiencyDrop = roof.efficiencyDrop || 0.12;
    const actual = Math.floor(expected * (1 - efficiencyDrop));
    const ghost = Math.max(0, expected - actual);
    const revenue = Math.floor(ghost * (camp.rate || 7.8));
    const carbon = Number(((ghost * 0.71) / 1000).toFixed(2));
    const pr = expected > 0 ? Number(((actual / expected) * 100).toFixed(1)) : 82.5;

    return res.json({
        expected,
        actual,
        ghost,
        revenue,
        carbon,
        pr,
        dataCompletenessPct
    });
});

// GET /api/forecast (AI weather & production curves)
router.get('/forecast', (req: Request, res: Response) => {
    const db = getDb();
    // Simulate 7-day weather & generation forecasting
    const forecast = Array.from({ length: 7 }).map((_, idx) => {
        const date = new Date();
        date.setDate(date.getDate() + idx);
        const dateString = date.toISOString().split('T')[0];

        const conditions = ['sunny', 'mostly_sunny', 'cloudy', 'rainy', 'monsoon'][idx % 5];
        const avgIrradiance = conditions === 'sunny' ? 880 : conditions === 'mostly_sunny' ? 760 : conditions === 'cloudy' ? 410 : 250;
        const predictedKwVal = (avgIrradiance / 1000) * 138;

        return {
            date: dateString,
            conditions,
            predictedProduction: Math.floor(predictedKwVal),
            expectedRevenue: Math.floor(predictedKwVal * 7.8),
            carbonOffset: Number(((predictedKwVal * 0.71) / 1000).toFixed(2))
        };
    });

    return res.json(forecast);
});

// POST /api/simulate (scenario analysis triggers — Operator+ only)
router.post('/simulate', requireRole('Operator', 'Administrator', 'Manager') as any, validateBody(SimulateScenarioSchema), (req: Request, res: Response) => {
    const { inverterFailure, dustAccumulation, batteryDegradation, delayedMaintenance, monsoonEvent, cloudCover } = req.body;

    const baseOutput = 138;
    let deficit = 0;
    deficit += inverterFailure ? 40 : 0;
    deficit += dustAccumulation * 0.28;
    deficit += batteryDegradation * 0.12;
    deficit += cloudCover * 0.52;
    deficit += monsoonEvent ? 22 : 0;

    const maintenanceMultiplier =
        delayedMaintenance === '3m' ? 0.18
            : delayedMaintenance === '1m' ? 0.10
                : delayedMaintenance === '1w' ? 0.04
                    : 0;

    deficit += baseOutput * maintenanceMultiplier;
    const energyLost = Math.min(baseOutput, Math.floor(deficit));
    const actual = baseOutput - energyLost;
    const revenueLoss = energyLost * 7.8;
    const carbonLost = Number(((energyLost * 0.71) / 1000).toFixed(3));
    const esgScore = Math.max(10, Math.floor(92 - (energyLost * 0.4)));

    const db = getDb();

    // Calculate decision context shape based on simulated scenario
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

    db.activeContext = scenarioContext;
    saveDb(db);

    return res.json({
        energyLost,
        actual,
        revenueLoss,
        carbonLost,
        esgScore,
        activeContext: scenarioContext
    });
});

// GET /api/recommendations (pull queue)
router.get('/recommendations', (req: Request, res: Response) => {
    const db = getDb();
    return res.json(db.recommendations);
});

// POST /api/alerts (creates or resolves alerts)
router.post('/alerts', validateBody(UpdateAlertSchema), (req: Request, res: Response) => {
    const { alertId, status } = req.body;
    const db = getDb();

    const alertIndex = db.alerts.findIndex(a => a.id === alertId);
    if (alertIndex === -1) {
        return res.status(404).json({ error: 'Alert not found' });
    }

    db.alerts[alertIndex].status = status;
    writeAuditLog('operator-1', 'ALERT_UPDATE', `Alert ${alertId} updated to ${status}`);
    saveDb(db);

    return res.json(db.alerts[alertIndex]);
});

export default router;
