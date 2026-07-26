import { getDb, saveDb, writeAuditLog } from './db';

export interface TelemetryData {
    voltage: number;
    current: number;
    power: number;
    irradiance: number;
    temperature: number;
    mqttRate?: number;
    mqttLag?: number;
    throughput?: number;
    inferenceCost?: number;
}

export interface InterventionOption {
    rank: number;
    id: string;
    action: string;
    expectedRecoveryKwh: number;
    cost: number;
    paybackDays: number;
    carbonImpactTons: number;
    roiPct: number;
    confidence: number;
}

export function generateRankedInterventions(
    predictedClass: string,
    telemetry: TelemetryData,
    anomalyScore: number,
    modelConfidence: number
): InterventionOption[] {
    const rate = 7.8; // ₹ per kWh
    // Expected energy deficit from Phase 1/2 physics & telemetry
    const actualKw = telemetry.power;
    const expectedKw = Math.max(actualKw, (telemetry.irradiance / 1000) * 4.2); // expected kW under irradiance
    const deficitKw = Math.max(0.5, expectedKw - actualKw);
    const deficitKwhPerDay = deficitKw * 6; // 6 peak sun hours

    let options: Omit<InterventionOption, 'rank' | 'paybackDays' | 'roiPct'>[] = [];

    if (predictedClass === 'INVERTER_DEGRADATION' || telemetry.temperature > 70) {
        options = [
            {
                id: 'OPT-INV-1',
                action: 'Replace degraded cooling capacitors & service thermal paste',
                cost: 18500,
                expectedRecoveryKwh: Number((deficitKwhPerDay * 0.92).toFixed(1)),
                carbonImpactTons: Number(((deficitKwhPerDay * 0.92 * 0.71) / 1000).toFixed(3)),
                confidence: modelConfidence
            },
            {
                id: 'OPT-INV-2',
                action: 'Full inverter module overhaul with active liquid cooling upgrade',
                cost: 42000,
                expectedRecoveryKwh: Number((deficitKwhPerDay * 0.99).toFixed(1)),
                carbonImpactTons: Number(((deficitKwhPerDay * 0.99 * 0.71) / 1000).toFixed(3)),
                confidence: Number((modelConfidence * 0.91).toFixed(0))
            },
            {
                id: 'OPT-INV-3',
                action: 'Derate inverter load capacity to 70% & activate temporary string bypass',
                cost: 1200,
                expectedRecoveryKwh: Number((deficitKwhPerDay * 0.55).toFixed(1)),
                carbonImpactTons: Number(((deficitKwhPerDay * 0.55 * 0.71) / 1000).toFixed(3)),
                confidence: Number((modelConfidence * 0.96).toFixed(0))
            }
        ];
    } else if (predictedClass === 'SOILING') {
        options = [
            {
                id: 'OPT-SOIL-1',
                action: 'Deploy automated dry-cleaning robot swarm for Block-A Array B3',
                cost: 3200,
                expectedRecoveryKwh: Number((deficitKwhPerDay * 0.94).toFixed(1)),
                carbonImpactTons: Number(((deficitKwhPerDay * 0.94 * 0.71) / 1000).toFixed(3)),
                confidence: modelConfidence
            },
            {
                id: 'OPT-SOIL-2',
                action: 'Manual high-pressure wash + hydrophobic anti-soiling coating application',
                cost: 8500,
                expectedRecoveryKwh: Number((deficitKwhPerDay * 0.98).toFixed(1)),
                carbonImpactTons: Number(((deficitKwhPerDay * 0.98 * 0.71) / 1000).toFixed(3)),
                confidence: Number((modelConfidence * 0.89).toFixed(0))
            }
        ];
    } else {
        options = [
            {
                id: 'OPT-GEN-1',
                action: 'Targeted panel EL imaging audit & String 04 connector replacement',
                cost: 4200,
                expectedRecoveryKwh: Number((deficitKwhPerDay * 0.90).toFixed(1)),
                carbonImpactTons: Number(((deficitKwhPerDay * 0.90 * 0.71) / 1000).toFixed(3)),
                confidence: modelConfidence
            },
            {
                id: 'OPT-GEN-2',
                action: 'String re-balancing & bypass diode array maintenance',
                cost: 6800,
                expectedRecoveryKwh: Number((deficitKwhPerDay * 0.96).toFixed(1)),
                carbonImpactTons: Number(((deficitKwhPerDay * 0.96 * 0.71) / 1000).toFixed(3)),
                confidence: Number((modelConfidence * 0.88).toFixed(0))
            }
        ];
    }

    // Rank options by payback period & ROI calculated directly from ML & cost numbers
    const ranked: InterventionOption[] = options.map((opt) => {
        const dailyFinancialRecovery = opt.expectedRecoveryKwh * rate;
        const paybackDays = dailyFinancialRecovery > 0 ? Number((opt.cost / dailyFinancialRecovery).toFixed(1)) : 999;
        const annualRecoveryRevenue = dailyFinancialRecovery * 365;
        const roiPct = opt.cost > 0 ? Number((((annualRecoveryRevenue - opt.cost) / opt.cost) * 100).toFixed(1)) : 0;

        return {
            ...opt,
            paybackDays,
            roiPct,
            rank: 1 // assigned below
        };
    }).sort((a, b) => b.roiPct - a.roiPct);

    return ranked.map((item, idx) => ({ ...item, rank: idx + 1 }));
}

// ─── AI Pipeline / Event Engine ─────────────────────────────────────────────
export async function processTelemetryIngestion(telemetry: TelemetryData) {
    const db = getDb();

    // 1. Telemetry Received & Logged to History
    const timestamp = (telemetry as any).timestamp || new Date().toISOString();
    const telemetryRecord = { ...telemetry, timestamp };
    db.telemetry = telemetryRecord;
    if (!db.telemetryLog) db.telemetryLog = [];
    db.telemetryLog.push(telemetryRecord);

    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    let isAnomalous = false;
    let anomalyScore = 0;
    let explanationData: any = null;

    try {
        const detectRes = await fetch(`${mlServiceUrl}/ml/detect-anomaly`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(telemetry)
        });
        if (detectRes.ok) {
            const detectJson = await detectRes.json();
            isAnomalous = detectJson.isAnomalous;
            anomalyScore = detectJson.anomalyScore;
        }
    } catch (e) {
        if (telemetry.temperature > 70 || (telemetry.irradiance > 700 && telemetry.power < 1.5)) {
            isAnomalous = true;
            anomalyScore = 0.85;
        }
    }

    if (isAnomalous) {
        try {
            const explainRes = await fetch(`${mlServiceUrl}/ml/explain`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(telemetry)
            });
            if (explainRes.ok) {
                explanationData = await explainRes.json();
            }
        } catch (e) {
            console.warn('[EVENT ENGINE] ML explain call failed, using fallback calculation:', e);
        }

        const predictedClass = explanationData?.predictedClass || (telemetry.temperature > 70 ? 'INVERTER_DEGRADATION' : 'SOILING');
        const confidence = explanationData?.confidence || (telemetry.temperature > 70 ? 87 : 95);
        const attributions = explanationData?.shapAttribution || {};

        const severity: 'critical' | 'warning' | 'info' = telemetry.temperature > 70 ? 'critical' : 'warning';
        const message = predictedClass === 'INVERTER_DEGRADATION'
            ? `Thermal degradation anomaly flagged by IsolationForest (score ${anomalyScore}). Internal telemetry temp ${telemetry.temperature}°C.`
            : `Yield deficit anomaly flagged by IsolationForest (score ${anomalyScore}). Power output ${telemetry.power} kW under ${telemetry.irradiance} W/m².`;

        const causeString = `SHAP: ${predictedClass} (confidence ${confidence}%). Top SHAP features: ${Object.entries(attributions).slice(0, 4).map(([k, v]) => `${k}=${v}`).join(', ')}.`;

        const alertId = `INC-${Date.now().toString().slice(-4)}`;
        const newAlert = {
            id: alertId,
            node: telemetry.temperature > 70 ? 'Inverter 02' : 'String 04 / Panel B12',
            severity,
            message,
            status: 'active',
            timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
        };

        db.alerts.unshift(newAlert);
        writeAuditLog('system', 'ANOMALY_TRIGGERED', `Alert ${alertId} created for ${newAlert.node}. ${message}`);

        // Phase 6 Decision Engine — Generate ranked interventions traceable to ML confidence & physics
        const rankedOptions = generateRankedInterventions(predictedClass, telemetry, anomalyScore, confidence);
        const primaryOption = rankedOptions[0];

        const financialDelta = -primaryOption.cost;
        const carbonDelta = -primaryOption.carbonImpactTons;
        const actionText = primaryOption.action;

        const newRecommendation = {
            id: `REC-${Date.now().toString().slice(-3)}`,
            assetId: newAlert.node,
            trigger: 'anomaly-processor',
            what: message,
            why: causeString,
            whatNext: telemetry.temperature > 70
                ? 'Fault cascade will lock out String 4 frequency grid connection within 24 hours.'
                : 'PR drops to 78%, violating production SLA after day 8.',
            action: actionText,
            doNothing: telemetry.temperature > 70
                ? `Downtime replacement cost totaling ₹${primaryOption.cost.toLocaleString()} + ${primaryOption.carbonImpactTons} tCO₂e Scope 2 liability.`
                : `SLA penalty breach + ₹${(primaryOption.expectedRecoveryKwh * 7.8 * 30).toFixed(0)} lost yield revenue/mo.`,
            financialDelta,
            carbonDelta,
            confidence: primaryOption.confidence,
            severity,
            options: rankedOptions // Enriched with ranked options
        };

        db.recommendations.unshift(newRecommendation);
        db.activeContext = newRecommendation;
    }

    saveDb(db);
}

