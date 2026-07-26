import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pushContext, ASSET_CONTEXTS } from '../store';
import { fetchGhostGeneration, fetchTelemetry } from '../apiClient';

// ── Types ────────────────────────────────────────────────────────────────────

type CCMode = 'LIVE' | 'INCIDENTS' | 'SIMULATE' | 'HISTORY';
type Severity = 'info' | 'warning' | 'critical';

interface Incident {
    id: string;
    assetId: string;
    title: string;
    description: string;
    severity: Severity;
    timestamp: string;
    rootCause: string;
    recoverable: number; // kWh/day
    recommendation: string;
    cost: number;
    paybackDays: number;
}

interface EventEntry {
    id: number;
    time: string;
    icon: string;
    label: string;
    assetId?: string;
    severity?: Severity;
}

// ── Static data (fallback when backend not yet connected) ─────────────────────

const LIVE_INCIDENTS: Incident[] = [
    {
        id: 'INC-001',
        assetId: 'Inverter 02',
        title: 'INV-03 Performance Loss',
        description: 'Inverter output 34% below expected. Internal temp 72°C.',
        severity: 'critical',
        timestamp: '14:31:52',
        rootCause: 'Soiling',
        recoverable: 15.5,
        recommendation: 'Clean Array A3 — Dry-wash recommended within 48h.',
        cost: 3200,
        paybackDays: 7,
    },
    {
        id: 'INC-002',
        assetId: 'Block-A Rooftop',
        title: 'ROOF-A2 Thermal Anomaly',
        description: 'IR scan shows hotspot cluster in String 4. Bypass diode suspect.',
        severity: 'warning',
        timestamp: '14:18:07',
        rootCause: 'Inverter degradation',
        recoverable: 8.2,
        recommendation: 'Schedule EL imaging for String 4 panels within 7 days.',
        cost: 4200,
        paybackDays: 18,
    },
];

const ROOT_CAUSES = [
    { label: 'SOILING', pct: 58, color: '#FFB800' },
    { label: 'INVERTER', pct: 21, color: '#FF6B35' },
    { label: 'GRID', pct: 13, color: '#9D00FF' },
    { label: 'SHADING', pct: 8, color: '#4DA6FF' },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function LiveIndicator() {
    return (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#00E676' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00E676', boxShadow: '0 0 8px #00E676', display: 'inline-block', animation: 'cc-pulse 1.8s ease-in-out infinite' }} />
            LIVE
        </span>
    );
}

function ModeTab({ label, active, onClick }: { label: CCMode; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '6px 16px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                background: active ? 'rgba(0,240,255,0.12)' : 'transparent',
                border: active ? '1px solid rgba(0,240,255,0.4)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '3px',
                color: active ? '#00F0FF' : 'rgba(255,255,255,0.45)',
                cursor: 'pointer',
                transition: 'all 0.15s',
            }}
        >
            {label}
        </button>
    );
}

function SeverityDot({ s }: { s: Severity }) {
    const c = s === 'critical' ? '#FF003C' : s === 'warning' ? '#FFB800' : '#00E676';
    return <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, boxShadow: `0 0 6px ${c}`, display: 'inline-block', flexShrink: 0 }} />;
}

function AssetTree({ onSelect, selectedId }: { onSelect: (id: string) => void; selectedId: string }) {
    const TREE: any[] = [
        {
            label: 'Jabalpur Campus', id: 'campus', icon: '🏫', children: [
                {
                    label: 'Block A Building', id: 'Block A Building', icon: '🏢', children: [
                        {
                            label: 'Block-A Rooftop', id: 'Block-A Rooftop', icon: '🔆', healthy: true, children: [
                                { label: 'Inverter 01', id: 'Inverter 01', icon: '⚡', healthy: true },
                                { label: 'Inverter 02 ⚠', id: 'Inverter 02', icon: '⚠️', healthy: false },
                                { label: 'Battery-X1', id: 'Storage Unit Battery-X1', icon: '🔋', healthy: true },
                            ]
                        }
                    ]
                }
            ]
        }
    ];

    const [expanded, setExpanded] = useState<string[]>(['campus', 'Block A Building', 'Block-A Rooftop']);

    const renderNode = (node: any, depth = 0): React.ReactElement => {
        const isExp = expanded.includes(node.id);
        const isSelected = selectedId === node.id;
        const hasChildren = node.children?.length;
        return (
            <div key={node.id} style={{ marginLeft: depth * 12 }}>
                <div
                    onClick={() => {
                        if (hasChildren) setExpanded(e => isExp ? e.filter(x => x !== node.id) : [...e, node.id]);
                        onSelect(node.id);
                    }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '5px 8px', borderRadius: '4px', cursor: 'pointer',
                        background: isSelected ? 'rgba(0,240,255,0.08)' : 'transparent',
                        border: isSelected ? '1px solid rgba(0,240,255,0.25)' : '1px solid transparent',
                        marginBottom: '2px', transition: 'all 0.15s',
                    }}
                >
                    {hasChildren && (
                        <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', width: 10 }}>{isExp ? '▼' : '▶'}</span>
                    )}
                    <span style={{ fontSize: '0.8rem' }}>{node.icon}</span>
                    <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
                        color: isSelected ? '#00F0FF' : node.healthy === false ? '#FF003C' : '#fff',
                        fontWeight: isSelected ? 600 : 400, flex: 1,
                    }}>
                        {node.label}
                    </span>
                    {node.healthy === false && <span style={{ fontSize: '0.6rem', color: '#FF003C', fontFamily: 'var(--font-mono)' }}>FAULT</span>}
                    {node.healthy === true && <span style={{ fontSize: '0.6rem', color: '#00E676', fontFamily: 'var(--font-mono)' }}>OK</span>}
                </div>
                {hasChildren && isExp && (
                    <div style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', marginLeft: 14 }}>
                        {node.children.map((c: any) => renderNode(c, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return <div>{TREE.map(n => renderNode(n))}</div>;
}

function GhostBar({ expected, actual }: { expected: number; actual: number }) {
    const ghost = Math.max(0, expected - actual);
    const recoverable = Math.round(ghost * 0.88);
    const pctAct = expected > 0 ? (actual / expected) * 100 : 75;
    const pctGhost = expected > 0 ? (ghost / expected) * 100 : 11;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 110 }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', letterSpacing: '0.08em' }}>GHOST GENERATION</span>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'baseline' }}>
                    <span style={{ color: '#FFD700', fontWeight: 700, fontSize: '0.85rem' }}>EXPECTED</span>
                    <span style={{ color: '#fff' }}>{expected} kW</span>
                </div>
            </div>
            <div style={{ flex: 1, position: 'relative', height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pctAct}%`, background: 'linear-gradient(90deg, #00E676, #00F0FF)', borderRadius: '4px 0 0 4px', transition: 'width 0.8s' }} />
                <div style={{ position: 'absolute', left: `${pctAct}%`, top: 0, height: '100%', width: `${pctGhost}%`, background: 'rgba(255,80,80,0.55)', borderRight: '1px dashed rgba(255,100,100,0.8)' }} />
            </div>
            <div style={{ display: 'flex', gap: '20px' }}>
                <div><span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>ACTUAL </span><span style={{ color: '#00F0FF', fontWeight: 700 }}>{actual} kW</span></div>
                <div><span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>GHOST </span><span style={{ color: '#FF6B6B', fontWeight: 700 }}>{ghost} kW</span></div>
                <div><span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>RECOVERABLE </span><span style={{ color: '#FFB800', fontWeight: 700 }}>{recoverable} kW</span></div>
            </div>
        </div>
    );
}

function EventStream({ events, onEventClick }: { events: EventEntry[]; onEventClick: (e: EventEntry) => void }) {
    return (
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', overflow: 'hidden', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
            <span style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', flexShrink: 0, fontSize: '0.65rem' }}>EVENT STREAM</span>
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                <div style={{ display: 'flex', gap: '24px', animation: 'cc-scroll 20s linear infinite', whiteSpace: 'nowrap' }}>
                    {[...events, ...events].map((ev, i) => (
                        <span
                            key={`${ev.id}-${i}`}
                            onClick={() => onEventClick(ev)}
                            style={{
                                color: ev.severity === 'critical' ? '#FF6B6B' : ev.severity === 'warning' ? '#FFB800' : 'rgba(255,255,255,0.55)',
                                cursor: 'pointer', flexShrink: 0,
                            }}
                        >
                            {ev.time} {ev.icon} {ev.label}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

function SystemHealth({ alerts }: { alerts: number }) {
    const health = 96.8;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', marginBottom: '6px' }}>SYSTEM HEALTH</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.4rem', fontWeight: 700, color: '#00E676', lineHeight: 1 }}>
                    {health}%
                </div>
                <div style={{ position: 'relative', height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginTop: 8 }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${health}%`, background: 'linear-gradient(90deg,#00E676,#00F0FF)', borderRadius: 2 }} />
                </div>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', marginBottom: '8px' }}>ACTIVE ALERTS</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: alerts > 0 ? '#FFB800' : '#00E676', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
                    {String(alerts).padStart(2, '0')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                    {LIVE_INCIDENTS.map(inc => (
                        <div key={inc.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 6px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', border: `1px solid ${inc.severity === 'critical' ? 'rgba(255,0,60,0.25)' : 'rgba(255,184,0,0.25)'}` }}>
                            <SeverityDot s={inc.severity} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: inc.severity === 'critical' ? '#FF6B6B' : '#FFB800', fontWeight: 600 }}>{inc.id}</div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'rgba(255,255,255,0.4)' }}>{inc.severity.toUpperCase()}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function AIDecisionPanel({ incident, onSimulate }: { incident: Incident | null; onSimulate: () => void }) {
    if (!incident) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', opacity: 0.35 }}>
            <div style={{ fontSize: '2rem' }}>🛰</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.1em' }}>SELECT INCIDENT</div>
        </div>
    );

    return (
        <motion.div
            key={incident.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', overflowY: 'auto' }}
        >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#00F0FF', letterSpacing: '0.1em' }}>AI DECISION</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#fff', fontWeight: 700 }}>INCIDENT: {incident.title}</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {ROOT_CAUSES.map(rc => (
                    <div key={rc.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', marginBottom: '3px' }}>
                            <span style={{ color: rc.color }}>{rc.label}</span>
                            <span style={{ color: '#fff' }}>{rc.pct}%</span>
                        </div>
                        <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${rc.pct}%` }} transition={{ duration: 0.7, delay: 0.2 }} style={{ height: '100%', background: rc.color, borderRadius: 2 }} />
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                    ['RECOVERABLE', `${incident.recoverable} kWh/day`, '#00E676'],
                    ['RECOMMENDED', incident.recommendation.split('—')[0], '#00F0FF'],
                    ['EST COST', `₹${incident.cost.toLocaleString('en-IN')}`, '#FFB800'],
                    ['PAYBACK', `${incident.paybackDays} days`, '#9D00FF'],
                ].map(([label, val, color]) => (
                    <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.68rem' }}>
                        <span style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em' }}>{label}</span>
                        <span style={{ color: color as string, fontWeight: 600 }}>{val}</span>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <button
                    onClick={onSimulate}
                    style={{
                        flex: 1, padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 700,
                        letterSpacing: '0.08em', background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.3)',
                        color: '#00F0FF', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                >
                    SIMULATE
                </button>
                <button
                    style={{
                        flex: 1, padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 700,
                        letterSpacing: '0.08em', background: '#00F0FF', border: 'none',
                        color: '#000', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                >
                    WORK ORDER
                </button>
            </div>
        </motion.div>
    );
}

function SimulatePanel({ onBack }: { onBack: () => void }) {
    const SCENARIOS = [
        { id: 'inv', label: 'Inverter INV-03 fails' },
        { id: 'delay7', label: 'Cleaning delayed 7 days' },
        { id: 'soil25', label: 'Soiling reaches 25%' },
        { id: 'grid', label: 'Grid voltage +8%' },
        { id: 'monsoon', label: 'Monsoon event occurs' },
    ];
    const [selected, setSelected] = useState('delay7');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const BASE = 109.3;

    const IMPACTS: Record<string, { after: number; loss: number; revenue: number; co2: number; failProb: number }> = {
        inv: { after: 72.1, loss: 2644, revenue: 20623, co2: 1877, failProb: 82 },
        delay7: { after: 97.1, loss: 1284, revenue: 10015, co2: 912, failProb: 18 },
        soil25: { after: 88.4, loss: 1643, revenue: 12815, co2: 1167, failProb: 11 },
        grid: { after: 102.5, loss: 586, revenue: 4571, co2: 416, failProb: 6 },
        monsoon: { after: 52.2, loss: 4889, revenue: 38134, co2: 3471, failProb: 34 },
    };

    const run = async () => {
        setLoading(true);
        await new Promise(r => setTimeout(r, 600));
        setResult(IMPACTS[selected]);
        setLoading(false);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#9D00FF', letterSpacing: '0.1em' }}>SCENARIO MODE</span>
                <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.68rem' }}>← BACK</button>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>What happens if:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {SCENARIOS.map(sc => (
                    <button
                        key={sc.id}
                        onClick={() => { setSelected(sc.id); setResult(null); }}
                        style={{
                            padding: '9px 12px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
                            background: selected === sc.id ? 'rgba(157,0,255,0.1)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${selected === sc.id ? 'rgba(157,0,255,0.4)' : 'rgba(255,255,255,0.07)'}`,
                            color: selected === sc.id ? '#9D00FF' : 'rgba(255,255,255,0.6)',
                            borderRadius: '4px', cursor: 'pointer',
                        }}
                    >
                        {selected === sc.id ? '◉' : '○'} {sc.label}
                    </button>
                ))}
            </div>
            <button
                onClick={run}
                style={{
                    padding: '10px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700,
                    background: loading ? 'rgba(157,0,255,0.06)' : 'rgba(157,0,255,0.15)',
                    border: '1px solid rgba(157,0,255,0.4)', color: '#9D00FF', borderRadius: '4px', cursor: 'pointer',
                }}
            >
                {loading ? 'COMPUTING...' : 'RUN SIMULATION'}
            </button>

            <AnimatePresence>
                {result && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.68rem' }}>
                            <span style={{ color: 'rgba(255,255,255,0.4)' }}>CURRENT</span><span style={{ color: '#00F0FF' }}>{BASE} kW</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.68rem' }}>
                            <span style={{ color: 'rgba(255,255,255,0.4)' }}>PROJECTED</span><span style={{ color: '#FF6B6B', fontWeight: 700 }}>{result.after} kW</span>
                        </div>
                        {[
                            ['ENERGY LOST', `${result.loss} kWh`, '#FFB800'],
                            ['REVENUE IMPACT', `₹${result.revenue.toLocaleString('en-IN')}`, '#FF003C'],
                            ['CO₂ IMPACT', `${result.co2} kg`, '#00E676'],
                            ['FAILURE PROB +', `${result.failProb}%`, '#9D00FF'],
                        ].map(([k, v, c]) => (
                            <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.67rem' }}>
                                <span style={{ color: 'rgba(255,255,255,0.35)' }}>{k}</span>
                                <span style={{ color: c as string, fontWeight: 600 }}>{v}</span>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ── Main Command Center ───────────────────────────────────────────────────────

export default function CommandCenter({ onClose }: { onClose: () => void }) {
    const [mode, setMode] = useState<CCMode>('LIVE');
    const [selectedAsset, setSelectedAsset] = useState('campus');
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(LIVE_INCIDENTS[0]);
    const [showSimulate, setShowSimulate] = useState(false);
    const [clock, setClock] = useState('');
    const [ghostData, setGhostData] = useState({ expected: 124.8, actual: 109.3 });
    const [telemetry, setTelemetry] = useState({ voltage: 230.5, current: 12.8, power: 2.94, irradiance: 842, temperature: 38.4 });

    // Clock
    useEffect(() => {
        const tick = () => {
            const now = new Date();
            setClock(now.toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' }) + ' IST');
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    // Fetch real ghost generation data
    useEffect(() => {
        fetchGhostGeneration('Jabalpur Campus (150 kWp)', 'Block-A Rooftop', 1).then(d => {
            if (d && d.expected) {
                const expectedKw = +(d.expected / 24).toFixed(1);
                const actualKw = +(d.actual / 24).toFixed(1);
                setGhostData({ expected: expectedKw, actual: actualKw });
            }
        });
    }, []);

    // Fetch live telemetry
    useEffect(() => {
        fetchTelemetry().then(d => {
            if (d && d.voltage) setTelemetry(d);
        });
        const id = setInterval(() => {
            fetchTelemetry().then(d => { if (d && d.voltage) setTelemetry(d); });
        }, 5000);
        return () => clearInterval(id);
    }, []);

    // Asset selection context
    const handleAssetSelect = useCallback((id: string) => {
        setSelectedAsset(id);
        const ctx = ASSET_CONTEXTS[id];
        if (ctx) pushContext(ctx);
        const inc = LIVE_INCIDENTS.find(i => i.assetId === id);
        if (inc) setSelectedIncident(inc);
    }, []);

    const events: EventEntry[] = [
        { id: 1, time: '14:31:52', icon: '⚠', label: 'INV-03 deviation detected', severity: 'critical', assetId: 'Inverter 02' },
        { id: 2, time: '14:31:54', icon: '◇', label: 'Physics residual calculated', severity: 'info' },
        { id: 3, time: '14:31:55', icon: '◇', label: 'Anomaly probability: 0.94', severity: 'warning' },
        { id: 4, time: '14:31:57', icon: '◆', label: 'SOILING identified as primary cause', severity: 'critical' },
        { id: 5, time: '14:31:59', icon: '✓', label: 'Recommendation generated', severity: 'info' },
        { id: 6, time: '14:18:07', icon: '⚠', label: 'ROOF-A2 thermal anomaly', severity: 'warning', assetId: 'Block-A Rooftop' },
    ];

    return (
        <motion.div
            key="cc-root"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
                position: 'fixed', inset: 0, zIndex: 2000,
                background: '#080A10',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            {/* CSS for animations */}
            <style>{`
        @keyframes cc-pulse { 0%,100%{opacity:1;box-shadow:0 0 6px #00E676} 50%{opacity:.5;box-shadow:0 0 14px #00E676} }
        @keyframes cc-scroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes cc-blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .cc-panel { background:rgba(12,14,22,0.85); border:1px solid rgba(255,255,255,0.07); border-radius:6px; }
      `}</style>

            {/* ── TOP BAR ── */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 24px', height: '52px', flexShrink: 0,
                borderBottom: '1px solid rgba(0,240,255,0.15)',
                background: 'rgba(8,10,16,0.95)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#00F0FF', fontWeight: 700, letterSpacing: '0.12em' }}>SPECTRAGRID</span>
                    <span style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.18em' }}>COMMAND CENTER</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <LiveIndicator />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>{clock}</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {(['LIVE', 'INCIDENTS', 'SIMULATE', 'HISTORY'] as CCMode[]).map(m => (
                            <ModeTab key={m} label={m} active={mode === m} onClick={() => { setMode(m); setShowSimulate(false); }} />
                        ))}
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,0,60,0.1)', border: '1px solid rgba(255,0,60,0.3)',
                            color: '#FF003C', borderRadius: '3px', padding: '5px 12px',
                            fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700,
                            cursor: 'pointer', letterSpacing: '0.08em',
                        }}
                    >
                        ✕ EXIT
                    </button>
                </div>
            </div>

            {/* ── MAIN 3-COLUMN BODY ── */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '220px 1fr 260px', overflow: 'hidden' }}>

                {/* LEFT — Asset Tree */}
                <div style={{ borderRight: '1px solid rgba(255,255,255,0.06)', padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>CAMPUS</div>
                    <AssetTree onSelect={handleAssetSelect} selectedId={selectedAsset} />

                    {/* Mini telemetry */}
                    <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {[
                            ['V', telemetry.voltage + ' V', '#fff'],
                            ['A', telemetry.current + ' A', '#fff'],
                            ['kW', telemetry.power + ' kW', '#00F0FF'],
                            ['°C', telemetry.temperature + '°', telemetry.temperature > 50 ? '#FF003C' : '#00E676'],
                            ['W/m²', telemetry.irradiance + '', '#FFB800'],
                        ].map(([k, v, c]) => (
                            <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
                                <span style={{ color: 'rgba(255,255,255,0.3)' }}>{k}</span>
                                <span style={{ color: c as string, fontWeight: 600 }}>{v}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CENTER — 3D Digital Twin hero + incident list */}
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {mode === 'LIVE' && (
                        <>
                            {/* 3D Twin placeholder */}
                            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(0,240,255,0.04) 0%, transparent 70%)' }}>
                                {/* Grid overlay */}
                                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,240,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.04) 1px, transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none' }} />

                                {/* Campus miniature visualization */}
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(0,240,255,0.4)', letterSpacing: '0.2em', marginBottom: '8px' }}>3D DIGITAL TWIN — JABALPUR CAMPUS</div>

                                    {/* Campus buildings */}
                                    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
                                        {[
                                            { label: 'Block A', height: 80, hasAnomaly: true, panels: 8 },
                                            { label: 'Library', height: 55, hasAnomaly: false, panels: 5 },
                                            { label: 'Hangar', height: 40, hasAnomaly: false, panels: 4 },
                                        ].map(b => (
                                            <div key={b.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                                                onClick={() => handleAssetSelect(b.hasAnomaly ? 'Inverter 02' : 'Block-A Rooftop')}
                                            >
                                                {/* Solar panels on rooftop */}
                                                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.ceil(b.panels / 2)}, 1fr)`, gap: '2px', marginBottom: '2px' }}>
                                                    {Array.from({ length: b.panels }).map((_, pi) => (
                                                        <div key={pi} style={{
                                                            width: 16, height: 10, borderRadius: '1px',
                                                            background: b.hasAnomaly && pi > 4 ? 'rgba(255,80,80,0.7)' : 'rgba(0,240,255,0.35)',
                                                            border: `1px solid ${b.hasAnomaly && pi > 4 ? 'rgba(255,80,80,0.8)' : 'rgba(0,240,255,0.4)'}`,
                                                            boxShadow: b.hasAnomaly && pi > 4 ? '0 0 6px rgba(255,80,80,0.6)' : '0 0 4px rgba(0,240,255,0.3)',
                                                            animation: b.hasAnomaly && pi > 4 ? 'cc-blink 2s ease-in-out infinite' : 'none',
                                                        }} />
                                                    ))}
                                                </div>
                                                {/* Building */}
                                                <div style={{
                                                    width: 70, height: b.height,
                                                    background: b.hasAnomaly
                                                        ? 'linear-gradient(180deg, rgba(255,80,80,0.15) 0%, rgba(20,22,35,0.9) 100%)'
                                                        : 'linear-gradient(180deg, rgba(0,240,255,0.08) 0%, rgba(20,22,35,0.9) 100%)',
                                                    border: `1px solid ${b.hasAnomaly ? 'rgba(255,80,80,0.35)' : 'rgba(0,240,255,0.15)'}`,
                                                    borderRadius: '3px 3px 0 0',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    boxShadow: b.hasAnomaly ? '0 0 20px rgba(255,80,80,0.2)' : '0 0 10px rgba(0,240,255,0.08)',
                                                }}>
                                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: b.hasAnomaly ? 'rgba(255,80,80,0.7)' : 'rgba(0,240,255,0.5)', textAlign: 'center', writingMode: 'vertical-rl' }}>
                                                        {b.hasAnomaly ? '⚠' : ''} {b.label}
                                                    </span>
                                                </div>
                                                {/* Ground */}
                                                <div style={{ width: 90, height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 1 }} />
                                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: b.hasAnomaly ? '#FFB800' : 'rgba(255,255,255,0.3)' }}>{b.label}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Energy flow lines */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)' }}>
                                        <span style={{ color: '#FFD700' }}>☀ SUN</span>
                                        <span style={{ color: '#00E676', animation: 'cc-scroll 2s linear infinite', display: 'inline-block' }}>→→→</span>
                                        <span style={{ color: '#00F0FF' }}>PANELS</span>
                                        <span style={{ color: '#00E676', animation: 'cc-scroll 2s linear infinite', display: 'inline-block' }}>→→→</span>
                                        <span style={{ color: '#FFB800' }}>INVERTER</span>
                                        <span style={{ color: '#FF6B6B', animation: 'cc-scroll 2s linear infinite', display: 'inline-block' }}>→→</span>
                                        <span style={{ color: '#fff' }}>GRID</span>
                                    </div>

                                    {selectedIncident && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            style={{
                                                position: 'absolute', top: 16, right: 16,
                                                background: 'rgba(255,0,60,0.08)', border: '1px solid rgba(255,0,60,0.3)',
                                                borderRadius: '5px', padding: '10px 14px',
                                                fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
                                            }}
                                        >
                                            <div style={{ color: '#FF6B6B', fontWeight: 700, marginBottom: '4px' }}>⚠ {selectedIncident.timestamp}</div>
                                            <div style={{ color: 'rgba(255,255,255,0.7)' }}>{selectedIncident.title}</div>
                                            <div style={{ color: '#FFB800', marginTop: '4px' }}>Root cause: {selectedIncident.rootCause}</div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {mode === 'INCIDENTS' && (
                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginBottom: '4px' }}>
                                {LIVE_INCIDENTS.length} ACTIVE INCIDENTS
                            </div>
                            {LIVE_INCIDENTS.map(inc => (
                                <motion.div
                                    key={inc.id}
                                    whileHover={{ scale: 1.01 }}
                                    onClick={() => { setSelectedIncident(inc); handleAssetSelect(inc.assetId); }}
                                    style={{
                                        padding: '16px', borderRadius: '6px', cursor: 'pointer',
                                        background: selectedIncident?.id === inc.id ? 'rgba(0,240,255,0.05)' : 'rgba(255,255,255,0.02)',
                                        border: `1px solid ${selectedIncident?.id === inc.id ? 'rgba(0,240,255,0.25)' : inc.severity === 'critical' ? 'rgba(255,0,60,0.2)' : 'rgba(255,184,0,0.2)'}`,
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                        <SeverityDot s={inc.severity} />
                                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.8rem', color: '#fff' }}>{inc.title}</span>
                                        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>{inc.timestamp}</span>
                                    </div>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)', marginBottom: '8px' }}>{inc.description}</div>
                                    <div style={{ display: 'flex', gap: '16px' }}>
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: inc.severity === 'critical' ? '#FF6B6B' : '#FFB800', fontWeight: 700 }}>{inc.severity.toUpperCase()}</span>
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#00E676' }}>↑ {inc.recoverable} kWh/day recoverable</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {mode === 'SIMULATE' && (
                        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                            <SimulatePanel onBack={() => setMode('LIVE')} />
                        </div>
                    )}

                    {mode === 'HISTORY' && (
                        <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>INCIDENT HISTORY — LAST 7 DAYS</div>
                            {[
                                { date: 'Jul 24', id: 'INC-042', title: 'Array A4 soiling peak', recovery: 'Cleaned', kWh: 18.2 },
                                { date: 'Jul 22', id: 'INC-041', title: 'INV-01 momentary trip', recovery: 'Auto-reset', kWh: 4.1 },
                                { date: 'Jul 20', id: 'INC-039', title: 'Grid voltage spike', recovery: 'Stabilized', kWh: 2.8 },
                                { date: 'Jul 18', id: 'INC-038', title: 'Sensor calibration drift', recovery: 'Recalibrated', kWh: 0.9 },
                            ].map(h => (
                                <div key={h.id} style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '5px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', width: 50 }}>{h.date}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#fff' }}>{h.id}: {h.title}</div>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: '#00E676', marginTop: '2px' }}>✓ {h.recovery}</div>
                                    </div>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#FFB800' }}>{h.kWh} kWh recovered</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT — System Health + AI Decision */}
                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <SystemHealth alerts={LIVE_INCIDENTS.length} />
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px', flex: 1 }}>
                        {showSimulate
                            ? <SimulatePanel onBack={() => setShowSimulate(false)} />
                            : <AIDecisionPanel incident={selectedIncident} onSimulate={() => setShowSimulate(true)} />
                        }
                    </div>
                </div>
            </div>

            {/* ── BOTTOM — Ghost Gen bar + Event stream ── */}
            <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(8,10,16,0.97)' }}>
                <div style={{ padding: '10px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <GhostBar expected={ghostData.expected} actual={ghostData.actual} />
                </div>
                <div style={{ padding: '8px 24px', background: 'rgba(0,0,0,0.3)' }}>
                    <EventStream events={events} onEventClick={ev => { if (ev.assetId) handleAssetSelect(ev.assetId); }} />
                </div>
            </div>
        </motion.div>
    );
}
