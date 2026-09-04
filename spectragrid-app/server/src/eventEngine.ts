import crypto from 'crypto';
import { appendTelemetry, createAlert, createRecommendation, setActiveContext, writeAuditLog } from './db';

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

// Task 5 — Rain forecast for Dynamic ROI Gate
async function getRainProbabilityTomorrow(): Promise<number | null> {
    try {
        const res = await fetch(
            'https://api.open-meteo.com/v1/forecast?latitude=23.18&longitude=79.98&daily=precipitation_probability_max&timezone=Asia%2FKolkata&forecast_days=2'
        );
        if (!res.ok) return null;
        const json = await res.json();
        const tomorrow = json?.daily?.precipitation_probability_max?.[1];
        return typeof tomorrow === 'number' ? tomorrow : null;
    } catch {
        return null;
    }
}

// Task 5 — Updated return type exposes deficitKwhPerDay & rate for the gate
export function generateRankedInterventions(
    predictedClass: string,
    telemetry: TelemetryData,
    anomalyScore: number,
    modelConfidence: number
): { options: InterventionOption[]; deficitKwhPerDay: number; rate: number } {
    const rate = 7.8; // ₹ per kWh
    const actualKw = telemetry.power;
    const expectedKw = Math.max(actualKw, (telemetry.irradiance / 1000) * 4.2);
    const deficitKw = Math.max(0.5, expectedKw - actualKw);
    const deficitKwhPerDay = deficitKw * 6; // 6 peak sun hours

    let rawOptions: Omit<InterventionOption, 'rank' | 'paybackDays' | 'roiPct'>[] = [];

    if (predictedClass === 'INVERTER_DEGRADATION' || telemetry.temperature > 70) {
        rawOptions = [
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
        rawOptions = [
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
        rawOptions = [
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

    const ranked: InterventionOption[] = rawOptions.map((opt) => {
        const dailyFinancialRecovery = opt.expectedRecoveryKwh * rate;
        const paybackDays = dailyFinancialRecovery > 0 ? Number((opt.cost / dailyFinancialRecovery).toFixed(1)) : 999;
        const annualRecoveryRevenue = dailyFinancialRecovery * 365;
        const roiPct = opt.cost > 0 ? Number((((annualRecoveryRevenue - opt.cost) / opt.cost) * 100).toFixed(1)) : 0;
        return { ...opt, paybackDays, roiPct, rank: 1 };
    }).sort((a, b) => b.roiPct - a.roiPct);

    return {
        options: ranked.map((item, idx) => ({ ...item, rank: idx + 1 })),
        deficitKwhPerDay,
        rate
    };
}

// Task 5 — Dynamic ROI Gate
interface ActionGateResult {
    decision: 'ACT_NOW' | 'DEFER';
    reason: string;
    autoTicketed: boolean;
}

function evaluateActionGate(
    predictedClass: string,
    primaryOption: InterventionOption,
    deficitKwhPerDay: number,
    rate: number,
    rainProbabilityTomorrow: number | null
): ActionGateResult {
    const oneDayLossIfDeferred = deficitKwhPerDay * rate;

    if (predictedClass === 'SOILING' && rainProbabilityTomorrow !== null
        && rainProbabilityTomorrow >= 60 && oneDayLossIfDeferred < primaryOption.cost) {
        return {
            decision: 'DEFER',
            reason: `${rainProbabilityTomorrow}% rain probability tomorrow; natural wash saves ₹${primaryOption.cost.toLocaleString()} vs. ₹${Math.round(oneDayLossIfDeferred)} one-day deferred loss.`,
            autoTicketed: false
        };
    }

    return {
        decision: 'ACT_NOW',
        reason: primaryOption.roiPct > 0
            ? `ROI-positive at ${primaryOption.roiPct}% with ${primaryOption.paybackDays}-day payback — auto-ticketed.`
            : `Flagged for manual review — ROI not yet positive at current cost.`,
        autoTicketed: primaryOption.roiPct > 0
    };
}

// ─── AI Pipeline / Event Engine ───────────────────────────────────────────────
export async function processTelemetryIngestion(telemetry: TelemetryData) {
    // 1. Telemetry Received & Logged to History (capped at 500 records by appendTelemetry)
    const timestamp = (telemetry as any).timestamp || new Date().toISOString();
    const telemetryRecord = { ...telemetry, timestamp };
    await appendTelemetry(telemetryRecord);

    // Task 2 — Build the ML service URL correctly (Render returns a bare hostname)
    const mlServiceUrl = process.env.ML_SERVICE_URL
        ? `https://${process.env.ML_SERVICE_URL}`
        : 'http://localhost:8000';

    let isAnomalous = false;
    let anomalyScore = 0;
    let explanationData: any = null;

    try {
        const detectRes = await fetch(`${mlServiceUrl}/ml/detect-anomaly`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(telemetry),
            signal: AbortSignal.timeout(3000)
        });
        if (detectRes.ok) {
            const detectJson = await detectRes.json();
            isAnomalous = detectJson.isAnomalous;
            anomalyScore = detectJson.anomalyScore;
        } else {
            throw new Error(`ML Service returned ${detectRes.status}`);
        }
    } catch (e) {
        console.warn('[EVENT ENGINE] ML anomaly detection failed or timed out, using fallback heuristic:', e);
        // Fallback: thermal safety ceiling only (matches ml_engine.py after Task 1 fix)
        if (telemetry.temperature > 70) {
            isAnomalous = true;
            anomalyScore = 0.85;
        }
    }

    if (isAnomalous) {
        try {
            const explainRes = await fetch(`${mlServiceUrl}/ml/explain`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(telemetry),
                signal: AbortSignal.timeout(3000)
            });
            if (explainRes.ok) {
                explanationData = await explainRes.json();
            } else {
                throw new Error(`ML Service returned ${explainRes.status}`);
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

        // Task 3 — Label honestly: SHAP only if the real model responded
        const usedRealModel = !!explanationData?.shapAttribution;
        const causeString = usedRealModel
            ? `SHAP: ${predictedClass} (confidence ${confidence}%). Top SHAP features: ${Object.entries(attributions).slice(0, 4).map(([k, v]) => `${k}=${v}`).join(', ')}.`
            : `Heuristic attribution: ${predictedClass} (confidence ${confidence}%, ML service unreachable — threshold-based estimate).`;

        const alertId = `INC-${crypto.randomUUID().slice(0, 8)}`;
        const newAlert = {
            id: alertId,
            node: telemetry.temperature > 70 ? 'Inverter 02' : 'String 04 / Panel B12',
            severity,
            message,
            status: 'active',
            timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
        };

        await createAlert(newAlert);
        await writeAuditLog('system', 'ANOMALY_TRIGGERED', `Alert ${alertId} created for ${newAlert.node}. ${message}`);

        // Task 5 — Decision gate using real rain forecast
        const { options: rankedOptions, deficitKwhPerDay, rate } = generateRankedInterventions(predictedClass, telemetry, anomalyScore, confidence);
        const primaryOption = rankedOptions[0];
        const rainProbabilityTomorrow = predictedClass === 'SOILING' ? await getRainProbabilityTomorrow() : null;
        const gate = evaluateActionGate(predictedClass, primaryOption, deficitKwhPerDay, rate, rainProbabilityTomorrow);

        const financialDelta = -primaryOption.cost;
        const carbonDelta = -primaryOption.carbonImpactTons;
        const actionText = primaryOption.action;

        const newRecommendation = {
            id: `REC-${crypto.randomUUID().slice(0, 8)}`,
            assetId: newAlert.node,
            trigger: 'anomaly-processor',
            what: message,
            why: causeString,
            whatNext: telemetry.temperature > 70
                ? 'Fault cascade will lock out String 4 frequency grid connection within 24 hours.'
                : 'PR drops to 78%, violating production SLA after day 8.',
            action: gate.decision === 'DEFER' ? `Deferred: ${gate.reason}` : actionText,
            doNothing: telemetry.temperature > 70
                ? `Downtime replacement cost totaling ₹${primaryOption.cost.toLocaleString()} + ${primaryOption.carbonImpactTons} tCO₂e Scope 2 liability.`
                : `SLA penalty breach + ₹${(primaryOption.expectedRecoveryKwh * 7.8 * 30).toFixed(0)} lost yield revenue/mo.`,
            financialDelta,
            carbonDelta,
            confidence: primaryOption.confidence,
            severity,
            options: rankedOptions,
            decisionGate: gate,
            autoTicketed: gate.autoTicketed
        };

        await createRecommendation(newRecommendation);
        await setActiveContext(newRecommendation);
    }
}
