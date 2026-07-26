import { useState, useEffect } from 'react';

type Listener = () => void;
const listeners = new Set<Listener>();

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

export type DecisionContext = {
    trigger: string;
    assetId: string;
    what: string;
    why: string;
    whatNext: string;
    action: string;
    doNothing: string;
    financialDelta: number;
    carbonDelta: number;
    confidence: number;
    severity: 'info' | 'warning' | 'critical';
    options?: InterventionOption[];
};

const DEFAULT_CONTEXT: DecisionContext = {
    trigger: 'system',
    assetId: 'Campus',
    severity: 'warning',
    what: 'Campus yielded 104 kWh against expected 138 kWh today.',
    why: 'SHAP attribution: soiling 42%, grid instability 24%, inverter degradation 18%.',
    whatNext: 'Performance ratio will drop below 80% within 12 days without intervention.',
    action: 'Deploy automated dry-cleaning robot swarm for Block-A Array B3',
    doNothing: '30-day loss: ₹1,82,000 revenue + 0.9 tCO₂e additional Scope 2 liability.',
    financialDelta: -3200,
    carbonDelta: -1.9,
    confidence: 91,
    options: [
        {
            rank: 1,
            id: 'OPT-1',
            action: 'Deploy automated dry-cleaning robot swarm for Block-A Array B3',
            cost: 3200,
            expectedRecoveryKwh: 31.5,
            paybackDays: 13.1,
            carbonImpactTons: 0.68,
            roiPct: 2685.2,
            confidence: 91
        },
        {
            rank: 2,
            id: 'OPT-2',
            action: 'Schedule Inverter 02 thermal inspection & cooling fan replacement',
            cost: 18500,
            expectedRecoveryKwh: 34.0,
            paybackDays: 69.5,
            carbonImpactTons: 0.74,
            roiPct: 423.8,
            confidence: 87
        }
    ]
};

const rawStore = {
    scrollProgress: 0,
    stage: 0,
    selectedCampus: 'Jabalpur (150 kWp)',
    selectedRooftop: 'Block-A Rooftop',
    selectedDateRange: 'Last 30 Days',
    activeNode: 'Campus' as string,
    telemetry: {
        voltage: 230.5,
        current: 12.8,
        power: 2.94,
        irradiance: 842,
        temperature: 38.4
    },
    expectedProduction: 138,
    actualProduction: 104,
    ghostGeneration: 34,
    revenueLoss: 21400,
    carbonImpact: 1.9,
    performanceRatio: 84.5,
    activeContext: DEFAULT_CONTEXT as DecisionContext,
};

export const store = new Proxy(rawStore, {
    set(target, prop, value) {
        (target as any)[prop] = value;
        listeners.forEach(l => l());
        return true;
    }
});

export function subscribe(listener: Listener) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
}

export function useStoreState() {
    const [state, setState] = useState(() => ({ ...rawStore }));
    useEffect(() => {
        return subscribe(() => { setState({ ...rawStore }); });
    }, []);
    return state;
}

/** Any section calls this to update Decision Panel context */
export function pushContext(ctx: Partial<DecisionContext> & Pick<DecisionContext, 'assetId' | 'trigger'>) {
    store.activeContext = { ...DEFAULT_CONTEXT, ...ctx } as DecisionContext;
}

/** Pre-built context objects for known asset nodes */
export const ASSET_CONTEXTS: Record<string, DecisionContext> = {
    'Jabalpur Campus (150 kWp)': {
        trigger: 'asset-click', assetId: 'campus', severity: 'warning',
        what: 'Jabalpur Campus yielded 104 kWh vs expected 138 kWh today (PR: 84.5%).',
        why: 'SHAP: soiling 42%, grid instability 24%, inverter degradation 18%, partial shading 10%.',
        whatNext: 'PR will breach 80% SLA within 8 days. String 4 estimated maintenance horizon: 45 days at current degradation rate.',
        action: 'Issue O&M work-order: Array B3 cleaning (5 days) + Inverter 02 thermal scan (14 days).',
        doNothing: '30-day cumulative: ₹1,82,000 revenue loss + 0.9 tCO₂e Scope 2 liability + SLA breach risk.',
        financialDelta: -21400, carbonDelta: -1.9, confidence: 91,
    },
    'Inverter 02': {
        trigger: 'asset-click', assetId: 'inverter02', severity: 'critical',
        what: 'Inverter 02 at 68% rated efficiency. Internal temp: 72°C (threshold: 65°C).',
        why: 'Thermal degradation from 3-month deferred maintenance. Capacitor ESR ageing confirmed.',
        whatNext: 'Complete trip probability within 45 days: 74%. String 4 offline risk: 91%.',
        action: 'Immediate: reduce load to 70%. Capacitor replacement within 7 days (₹18,500).',
        doNothing: 'Unplanned failure: ₹2.4L replacement + downtime + 3.4 tCO₂e lost generation.',
        financialDelta: -45000, carbonDelta: -3.4, confidence: 87,
    },
    'Panel B12': {
        trigger: 'asset-click', assetId: 'panelB12', severity: 'critical',
        what: 'Panel B12: 8V/1.2A output. Expected 32V/8A at 840 W/m². Severe underperformance.',
        why: 'Hot-spot thermal signature at row 3. Bypass diode failure or microfracture confirmed by IR.',
        whatNext: 'Hot-spot progression: -6% efficiency/month. Adjacent panels at cascade risk within Q3.',
        action: 'Replace Panel B12 (₹4,200 incl. labour). EL imaging for String 4 panels recommended.',
        doNothing: 'Annual string-level cascade loss: ₹32,000 + 1.1 tCO₂e if left unaddressed.',
        financialDelta: -4200, carbonDelta: -0.3, confidence: 94,
    },
    'Block-A Rooftop': {
        trigger: 'asset-click', assetId: 'rooftopA', severity: 'warning',
        what: 'Block-A Rooftop PR: 84.5%. Last O&M cleaning: 47 days ago.',
        why: 'Soiling (42%) is the dominant loss driver per Open-Meteo irradiance cross-validation.',
        whatNext: 'PR reaches 78% (SLA breach threshold) within 8 days without cleaning intervention.',
        action: 'Schedule cleaning visit. Cost ₹3,200. Recoverable yield: 18–22 kWh/day.',
        doNothing: '30-day compounding: ₹52,000 revenue loss + 0.6 tCO₂e + SLA breach penalty after day 8.',
        financialDelta: -3200, carbonDelta: -0.6, confidence: 89,
    },
    'Storage Unit Battery-X1': {
        trigger: 'asset-click', assetId: 'batteryX1', severity: 'info',
        what: 'Battery-X1 nominal. State-of-health: 91%. Cycle count: 312. Temp: 28°C.',
        why: 'No anomalies. All SHAP indicators within 1σ of baseline fleet health model.',
        whatNext: 'SoH reaches 80% replacement threshold in ~14 months at current cycle rate.',
        action: 'No immediate action. Schedule capacity baseline test at cycle 350.',
        doNothing: 'No near-term risk. Quarterly SoH monitoring sufficient.',
        financialDelta: 0, carbonDelta: 0, confidence: 97,
    },
    'Inverter 01': {
        trigger: 'asset-click', assetId: 'inverter01', severity: 'info',
        what: 'Inverter 01 operating at 96.2% rated efficiency. All parameters nominal.',
        why: 'Serviced 12 days ago. SHAP baseline variance < 0.5% across all sub-systems.',
        whatNext: 'No predicted failures within 90 days. Next recommended service: 180 days.',
        action: 'No action required. Continue scheduled monitoring at 30-day intervals.',
        doNothing: 'No financial or carbon risk within planning horizon.',
        financialDelta: 0, carbonDelta: 0, confidence: 98,
    },
};

export type AppStore = typeof rawStore;
