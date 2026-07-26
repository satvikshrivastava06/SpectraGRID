import { useState, useEffect, useRef } from 'react';
import { pushContext } from '../store';

// ─── Scenario Parameter Types ───────────────────────────────────────────────
type ScenarioState = {
    inverterFailure: boolean;
    dustAccumulation: number;       // 0–100 %
    batteryDegradation: number;     // 0–100 %
    delayedMaintenance: 'none' | '1w' | '1m' | '3m';
    monsoonEvent: boolean;
    cloudCover: number;             // 0–100 %
};

// ─── Impact Calculation Engine ────────────────────────────────────────────────
function computeImpact(s: ScenarioState) {
    const baseOutput = 138; // kWh/day baseline

    let deficit = 0;
    deficit += s.inverterFailure ? 40 : 0;
    deficit += s.dustAccumulation * 0.28;
    deficit += s.batteryDegradation * 0.12;
    deficit += s.cloudCover * 0.52;
    deficit += s.monsoonEvent ? 22 : 0;
    const maintenanceMultiplier =
        s.delayedMaintenance === '3m' ? 0.18
            : s.delayedMaintenance === '1m' ? 0.10
                : s.delayedMaintenance === '1w' ? 0.04
                    : 0;
    deficit += baseOutput * maintenanceMultiplier;

    const energyLost = Math.min(baseOutput, Math.floor(deficit));
    const actual = baseOutput - energyLost;

    const revenueRate = 7.8; // ₹/kWh
    const revenueLoss = Math.floor(energyLost * revenueRate);
    const carbonLost = Number(((energyLost * 0.71) / 1000).toFixed(3)); // tCO₂e

    const baseEsg = 92;
    const esgScore = Math.max(10, Math.floor(
        baseEsg
        - (s.inverterFailure ? 25 : 0)
        - (s.dustAccumulation * 0.18)
        - (s.batteryDegradation * 0.08)
        - (s.cloudCover * 0.05)
        - (s.monsoonEvent ? 10 : 0)
        - (maintenanceMultiplier * 40)
    ));

    const esgGrade =
        esgScore >= 85 ? 'A+' : esgScore >= 70 ? 'A'
            : esgScore >= 55 ? 'B' : esgScore >= 40 ? 'C' : 'D';

    const baseMaint = 1200;
    const maintenanceCost = Math.floor(
        baseMaint
        + (s.inverterFailure ? 18500 : 0)
        + (s.dustAccumulation * 35)
        + (s.batteryDegradation * 22)
        + (maintenanceMultiplier > 0 ? 9000 * maintenanceMultiplier * 10 : 0)
    );

    return { energyLost, actual, revenueLoss, carbonLost, esgScore, esgGrade, maintenanceCost };
}

// ─── Spark Line mini-chart ─────────────────────────────────────────────────
function SparkLine({ values, color }: { values: number[]; color: string }) {
    const max = Math.max(...values, 1);
    const min = Math.min(...values);
    const range = max - min || 1;
    const w = 100, h = 36;
    const pts = values.map((v, i) => {
        const x = (i / (values.length - 1)) * w;
        const y = h - ((v - min) / range) * h;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: '36px' }} preserveAspectRatio="none">
            <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" />
        </svg>
    );
}

// ─── Toggle Switch ─────────────────────────────────────────────────────────
function Toggle({ value, onChange, label, danger }: {
    value: boolean; onChange: (v: boolean) => void; label: string; danger?: boolean;
}) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="mono" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>{label}</span>
            <button
                onClick={() => onChange(!value)}
                style={{
                    width: '48px', height: '24px', borderRadius: '12px',
                    background: value ? (danger ? 'var(--color-red)' : 'var(--color-cyan)') : 'rgba(255,255,255,0.1)',
                    position: 'relative', transition: 'background 0.25s', flexShrink: 0
                }}
            >
                <span style={{
                    position: 'absolute', top: '3px',
                    left: value ? '26px' : '3px',
                    width: '18px', height: '18px', borderRadius: '50%',
                    background: '#FFF', transition: 'left 0.25s'
                }} />
            </button>
        </div>
    );
}

// ─── Slider Control ────────────────────────────────────────────────────────
function SliderControl({ label, value, onChange, unit = '%' }: {
    label: string; value: number; onChange: (v: number) => void; unit?: string;
}) {
    const danger = value > 60;
    return (
        <div style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="mono" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>{label}</span>
                <span className="mono" style={{ fontSize: '0.85rem', color: danger ? 'var(--color-red)' : 'var(--color-cyan)', fontWeight: 600 }}>
                    {value}{unit}
                </span>
            </div>
            <div style={{ position: 'relative', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px' }}>
                <div style={{
                    position: 'absolute', top: 0, left: 0, height: '100%', borderRadius: '2px',
                    width: `${value}%`,
                    background: danger ? 'var(--color-red)' : 'var(--color-cyan)',
                    transition: 'background 0.2s'
                }} />
                <input type="range" min={0} max={100} value={value}
                    onChange={e => onChange(Number(e.target.value))}
                    style={{ position: 'absolute', top: '-10px', left: 0, width: '100%', opacity: 0, cursor: 'pointer', height: '24px' }}
                />
            </div>
        </div>
    );
}

// ─── Scenarios Presets ─────────────────────────────────────────────────────
const PRESETS: { name: string; scenario: Partial<ScenarioState> }[] = [
    { name: 'Baseline', scenario: { inverterFailure: false, dustAccumulation: 0, batteryDegradation: 0, delayedMaintenance: 'none', monsoonEvent: false, cloudCover: 0 } },
    { name: 'Monsoon Crisis', scenario: { monsoonEvent: true, cloudCover: 85, dustAccumulation: 60 } },
    { name: 'Inverter Trip', scenario: { inverterFailure: true, delayedMaintenance: '1m' } },
    { name: 'Neglected Array', scenario: { dustAccumulation: 90, batteryDegradation: 70, delayedMaintenance: '3m' } },
];

import { triggerSimulation } from '../apiClient';

export default function GhostReplayUI() {
    const [scenario, setScenario] = useState<ScenarioState>({
        inverterFailure: false,
        dustAccumulation: 30,
        batteryDegradation: 10,
        delayedMaintenance: 'none',
        monsoonEvent: false,
        cloudCover: 15,
    });

    const [impact, setImpact] = useState(() => computeImpact(scenario));

    // Wire to backend API triggerSimulation
    useEffect(() => {
        let isMounted = true;
        triggerSimulation(scenario).then(res => {
            if (isMounted) {
                if (res && res.energyLost !== undefined) {
                    setImpact({
                        energyLost: res.energyLost,
                        actual: res.actual,
                        revenueLoss: res.revenueLoss,
                        carbonLost: res.carbonLost,
                        esgScore: res.esgScore,
                        esgGrade: res.esgScore >= 85 ? 'A+' : res.esgScore >= 70 ? 'A' : res.esgScore >= 55 ? 'B' : res.esgScore >= 40 ? 'C' : 'D',
                        maintenanceCost: Math.floor(1200 + (scenario.inverterFailure ? 18500 : 0) + (scenario.dustAccumulation * 35))
                    });
                    if (res.activeContext) {
                        pushContext(res.activeContext);
                    }
                } else {
                    setImpact(computeImpact(scenario));
                }
            }
        });
        return () => { isMounted = false; };
    }, [scenario]);

    // ─── Historical sparkline data ───────────────────────────────────────────
    const energyHistory = useRef<number[]>(Array(24).fill(138));
    const revenueHistory = useRef<number[]>(Array(24).fill(0));
    const esgHistory = useRef<number[]>(Array(24).fill(92));
    const [, rerender] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            energyHistory.current = [...energyHistory.current.slice(1), impact.actual + (Math.random() - 0.5) * 4];
            revenueHistory.current = [...revenueHistory.current.slice(1), impact.revenueLoss + (Math.random() - 0.5) * 200];
            esgHistory.current = [...esgHistory.current.slice(1), impact.esgScore + (Math.random() - 0.5) * 2];
            rerender(t => t + 1);
        }, 1800);
        return () => clearInterval(interval);
    }, [impact.actual, impact.revenueLoss, impact.esgScore]);

    useEffect(() => {
        let what = 'Scenario simulator running.';
        let why = 'Parameters modified: ';
        let whatNext = '';
        let action = '';
        let doNothing = '';
        const params: string[] = [];

        if (scenario.inverterFailure) params.push('Inverter 02 Fail');
        if (scenario.monsoonEvent) params.push('Monsoon weather');
        if (scenario.dustAccumulation > 0) params.push(`Soiling ${scenario.dustAccumulation}%`);
        if (scenario.batteryDegradation > 0) params.push(`Battery Degr ${scenario.batteryDegradation}%`);
        if (scenario.cloudCover > 0) params.push(`Cloud cover ${scenario.cloudCover}%`);
        if (scenario.delayedMaintenance !== 'none') params.push(`Maint delay ${scenario.delayedMaintenance}`);

        why += params.length ? params.join(', ') : 'no active stresses.';

        if (scenario.inverterFailure) {
            what = 'Inverter 02 trip event simulated. Energy generation drops by 40 kWh/day.';
            whatNext = 'Downtime cascades. Potential battery deep discharge loop if weather conditions deteriorate.';
            action = 'Issue priority inverter capacitor replacement ticket (₹18,500).';
        } else if (scenario.monsoonEvent) {
            what = 'Active monsoon event simulated. Irradiance levels capped at 220 W/m².';
            whatNext = 'System yields drop 22 kWh/day. Soiling wash off occurs naturally, lowering dust to 0%.';
            action = 'Optimize battery state-of-charge schedule to maintain grid frequency reserve.';
        } else if (scenario.dustAccumulation > 50) {
            what = `High dust concentration (${scenario.dustAccumulation}%) causing ${impact.energyLost} kWh of Ghost Generation daily.`;
            whatNext = `Yield reduction rate: -0.28 kWh per % dust. PR will stabilize at sub-optimal ${(100 * impact.actual / 138).toFixed(1)}% level.`;
            action = 'Trigger dry-wash cleaning bots to clear array panels.';
        } else {
            what = 'Nominal simulation parameters configured.';
            whatNext = 'Expected annual yield is on track for target capacity factor.';
            action = 'Keep standard telemetry monitoring enabled.';
        }

        if (!action) action = 'Run standard diagnostic routine.';
        if (!doNothing) doNothing = `Compounding energy loss: ${impact.energyLost} kWh / ₹${impact.revenueLoss}.`;
        if (!whatNext) whatNext = 'System will stabilize at degraded output level.';

        pushContext({
            trigger: 'scenario',
            assetId: 'Scenario Simulator',
            what,
            why,
            whatNext,
            action,
            doNothing,
            financialDelta: -impact.revenueLoss,
            carbonDelta: -impact.carbonLost,
            confidence: 94,
            severity: impact.energyLost > 50 ? 'critical' : impact.energyLost > 20 ? 'warning' : 'info',
        });
    }, [scenario, impact]);

    const update = (patch: Partial<ScenarioState>) => setScenario(s => ({ ...s, ...patch }));
    const applyPreset = (p: typeof PRESETS[0]) =>
        setScenario(s => ({ ...s, ...p.scenario } as ScenarioState));

    return (
        <section id="scenario-simulator" className="section">
            <div className="section-inner" style={{ maxWidth: '1440px' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                    <div className="section-eyebrow">// Digital Twin Sandbox</div>
                    <h2 className="section-title">Infrastructure Scenario Simulator</h2>
                    <p className="section-subtitle" style={{ margin: '0 auto', maxWidth: '620px' }}>
                        Simulate real-world stress events and instantly observe cascading impacts across energy, carbon, financial, and ESG dimensions.
                    </p>
                </div>

                {/* Preset Buttons */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '40px' }}>
                    {PRESETS.map(p => (
                        <button
                            key={p.name}
                            onClick={() => applyPreset(p)}
                            className="mono"
                            style={{
                                padding: '8px 18px', fontSize: '0.8rem', borderRadius: '4px',
                                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)',
                                color: '#FFF', cursor: 'pointer', letterSpacing: '0.05em',
                                transition: 'background 0.2s, border 0.2s'
                            }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-cyan)')}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)')}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>

                {/* Main grid: left controls | right impact */}
                <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '32px', alignItems: 'start' }}>

                    {/* ── LEFT: Scenario Controls ── */}
                    <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div className="mono" style={{ fontSize: '0.8rem', letterSpacing: '1px', opacity: 0.5, marginBottom: '16px' }}>
              // SIMULATION PARAMETERS
                        </div>

                        <Toggle label="⚡  Inverter Failure" value={scenario.inverterFailure} onChange={v => update({ inverterFailure: v })} danger />
                        <Toggle label="🌧️  Monsoon Event" value={scenario.monsoonEvent} onChange={v => update({ monsoonEvent: v })} danger />

                        <div style={{ marginTop: '8px' }}>
                            <SliderControl label="🌫️  Dust Accumulation" value={scenario.dustAccumulation} onChange={v => update({ dustAccumulation: v })} />
                            <SliderControl label="🔋  Battery Degradation" value={scenario.batteryDegradation} onChange={v => update({ batteryDegradation: v })} />
                            <SliderControl label="☁️  Cloud Cover" value={scenario.cloudCover} onChange={v => update({ cloudCover: v })} />
                        </div>

                        <div style={{ paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label className="mono" style={{ fontSize: '0.75rem', opacity: 0.5 }}>DELAYED MAINTENANCE</label>
                            <select
                                value={scenario.delayedMaintenance}
                                onChange={e => update({ delayedMaintenance: e.target.value as ScenarioState['delayedMaintenance'] })}
                                style={{ background: '#0a0c10', color: '#FFF', border: '1px solid rgba(255,255,255,0.08)', padding: '10px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', outline: 'none' }}
                            >
                                <option value="none">None (On Schedule)</option>
                                <option value="1w">Delayed 1 Week</option>
                                <option value="1m">Delayed 1 Month</option>
                                <option value="3m">Delayed 3 Months</option>
                            </select>
                        </div>
                    </div>

                    {/* ── RIGHT: Impact Outputs ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                        {/* KPI Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>

                            <div className="glass-panel" style={{ padding: '22px', borderLeft: `3px solid ${impact.energyLost > 50 ? 'var(--color-red)' : 'var(--color-cyan)'}` }}>
                                <div className="mono" style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '6px' }}>ENERGY LOST</div>
                                <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 700, color: impact.energyLost > 50 ? 'var(--color-red)' : 'var(--color-cyan)' }}>
                                    {impact.energyLost} <span style={{ fontSize: '0.85rem' }}>kWh</span>
                                </div>
                                <SparkLine values={energyHistory.current.map(v => 138 - v)} color={impact.energyLost > 50 ? 'var(--color-red)' : 'var(--color-cyan)'} />
                            </div>

                            <div className="glass-panel" style={{ padding: '22px', borderLeft: '3px solid var(--color-amber)' }}>
                                <div className="mono" style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '6px' }}>REVENUE LOSS</div>
                                <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-amber)' }}>
                                    ₹{impact.revenueLoss.toLocaleString('en-IN')}
                                </div>
                                <SparkLine values={revenueHistory.current} color="var(--color-amber)" />
                            </div>

                            <div className="glass-panel" style={{ padding: '22px', borderLeft: '3px solid var(--color-emerald)' }}>
                                <div className="mono" style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '6px' }}>CARBON LOST</div>
                                <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-emerald)' }}>
                                    {impact.carbonLost} <span style={{ fontSize: '0.85rem' }}>tCO₂</span>
                                </div>
                                <div className="mono" style={{ fontSize: '0.7rem', opacity: 0.4, marginTop: '6px' }}>Scope 2 emission liability</div>
                            </div>
                        </div>

                        {/* ESG + Maintenance row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                            <div className="glass-panel" style={{ padding: '22px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                                <div style={{
                                    width: '72px', height: '72px', borderRadius: '50%', flexShrink: 0,
                                    border: `4px solid ${impact.esgScore >= 70 ? 'var(--color-emerald)' : impact.esgScore >= 40 ? 'var(--color-amber)' : 'var(--color-red)'}`,
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: impact.esgScore >= 70 ? '0 0 14px rgba(0,230,130,0.3)' : '0 0 14px rgba(255,80,50,0.3)',
                                }}>
                                    <span className="mono" style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFF' }}>{impact.esgGrade}</span>
                                </div>
                                <div>
                                    <div className="mono" style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '4px' }}>ESG HEALTH SCORE</div>
                                    <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FFF' }}>{impact.esgScore}<span style={{ fontSize: '0.9rem', opacity: 0.5 }}>/100</span></div>
                                    <SparkLine values={esgHistory.current} color={impact.esgScore >= 70 ? 'var(--color-emerald)' : 'var(--color-red)'} />
                                </div>
                            </div>

                            <div className="glass-panel" style={{ padding: '22px' }}>
                                <div className="mono" style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '8px' }}>MAINTENANCE & REPAIR COST</div>
                                <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-violet)' }}>
                                    ₹{impact.maintenanceCost.toLocaleString('en-IN')}
                                </div>
                                <div className="mono" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '10px', lineHeight: 1.5 }}>
                                    {scenario.inverterFailure ? '• Inverter unit replacement estimated ₹18,500\n' : ''}
                                    {scenario.dustAccumulation > 50 ? '• Cleaning team dispatch required' : '• No critical maintenance flagged'}
                                </div>
                            </div>
                        </div>

                        {/* Scenario narrative console */}
                        <div className="glass-panel mono" style={{ padding: '18px 22px', fontSize: '0.8rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.7)', borderLeft: '3px solid rgba(255,255,255,0.08)' }}>
                            <span style={{ color: 'var(--color-cyan)', fontWeight: 600 }}>[$TWIN:SIM]</span>{' '}
                            {scenario.inverterFailure && <span style={{ color: 'var(--color-red)' }}>CRITICAL: Inverter 02 trip detected. String-level bypass activated. </span>}
                            {scenario.dustAccumulation > 60 && <span style={{ color: 'var(--color-amber)' }}>WARNING: Soiling ratio {scenario.dustAccumulation}% exceeds cleaning threshold. </span>}
                            {scenario.monsoonEvent && <span style={{ color: 'var(--color-violet)' }}>WEATHER: Active monsoon event suppressing irradiance {`>`} 80%. </span>}
                            {!scenario.inverterFailure && !scenario.monsoonEvent && scenario.dustAccumulation <= 60
                                ? 'System operating within acceptable variance bands. No critical thresholds breached.'
                                : ''}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
