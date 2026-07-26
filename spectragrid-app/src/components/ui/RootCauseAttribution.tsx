import { useState } from 'react';

type TabType = 'sankey' | 'energyflow' | 'causal';

export default function RootCauseAttribution() {
    const [activeTab, setActiveTab] = useState<TabType>('sankey');

    return (
        <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '480px' }}>

            {/* Header and Toggle Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <span className="mono" style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem', color: 'var(--color-cyan)' }}>
            // Diagnostics & Attribution
                    </span>
                    <h3 style={{ fontSize: '1.25rem', color: '#FFF', marginTop: '4px' }}>Ghost Source Attribution Engine</h3>
                </div>

                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', padding: '2px', borderRadius: '4px' }} className="mono">
                    <button
                        onClick={() => setActiveTab('sankey')}
                        style={{
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            borderRadius: '3px',
                            background: activeTab === 'sankey' ? 'var(--color-cyan)' : 'transparent',
                            color: activeTab === 'sankey' ? '#000' : '#FFF',
                            fontWeight: activeTab === 'sankey' ? 600 : 400,
                            transition: 'all 0.2s'
                        }}
                    >
                        Sankey Flow
                    </button>
                    <button
                        onClick={() => setActiveTab('energyflow')}
                        style={{
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            borderRadius: '3px',
                            background: activeTab === 'energyflow' ? 'var(--color-cyan)' : 'transparent',
                            color: activeTab === 'energyflow' ? '#000' : '#FFF',
                            fontWeight: activeTab === 'energyflow' ? 600 : 400,
                            transition: 'all 0.2s'
                        }}
                    >
                        Energy Map
                    </button>
                    <button
                        onClick={() => setActiveTab('causal')}
                        style={{
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            borderRadius: '3px',
                            background: activeTab === 'causal' ? 'var(--color-cyan)' : 'transparent',
                            color: activeTab === 'causal' ? '#000' : '#FFF',
                            fontWeight: activeTab === 'causal' ? 600 : 400,
                            transition: 'all 0.2s'
                        }}
                    >
                        Causal Graph
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, minHeight: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

                {/* SANKEY DIAGRAM VIEW */}
                {activeTab === 'sankey' && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <span className="mono" style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                            Visualizes energy routing from incident photons to actual yield vs GGI sinks.
                        </span>
                        <svg viewBox="0 0 600 240" style={{ width: '100%', height: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <defs>
                                <linearGradient id="grad-actual" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="var(--color-gold)" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="var(--color-cyan)" stopOpacity="0.8" />
                                </linearGradient>
                                <linearGradient id="grad-loss" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="var(--color-gold)" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="var(--color-red)" stopOpacity="0.8" />
                                </linearGradient>
                            </defs>

                            {/* FLOW LINES - BEZIERS */}
                            {/* Photons to Actual Yield */}
                            <path d="M 60,60 C 200,60 200,50 440,50" fill="none" stroke="url(#grad-actual)" strokeWidth="40" />
                            {/* Photons to Ghost Generation */}
                            <path d="M 60,110 C 200,110 200,170 440,170" fill="none" stroke="url(#grad-loss)" strokeWidth="24" />

                            {/* NODES */}
                            {/* Incident Solar energy Node */}
                            <rect x="20" y="30" width="40" height="120" rx="2" fill="var(--color-gold)" opacity="0.8" />
                            <text x="25" y="22" fill="#FFF" className="mono" fontSize="10">SOURCE: SUN</text>

                            {/* Actual Yield Node */}
                            <rect x="440" y="20" width="30" height="60" rx="2" fill="var(--color-cyan)" />
                            <text x="480" y="45" fill="var(--color-cyan)" className="mono" fontSize="11" fontWeight="700">ACTUAL YIELD</text>
                            <text x="480" y="60" fill="rgba(255,255,255,0.6)" className="mono" fontSize="10">104 kWh (75.4%)</text>

                            {/* Ghost Generation Node */}
                            <rect x="440" y="140" width="30" height="60" rx="2" fill="var(--color-red)" />
                            <text x="480" y="160" fill="var(--color-red)" className="mono" fontSize="11" fontWeight="700">GHOST LOSS</text>
                            <text x="480" y="175" fill="rgba(255,255,255,0.6)" className="mono" fontSize="10">34 kWh (24.6%)</text>
                        </svg>
                    </div>
                )}

                {/* ENERGY FLOW MAP VIEW */}
                {activeTab === 'energyflow' && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <span className="mono" style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                            Telemetry topology map monitoring real-time panel string voltage registers.
                        </span>
                        <svg viewBox="0 0 600 240" style={{ width: '100%', height: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.04)' }}>

                            {/* Connection paths */}
                            <line x1="80" y1="120" x2="220" y2="70" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="5,5" />
                            <line x1="80" y1="120" x2="220" y2="170" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="5,5" />
                            <line x1="220" y1="70" x2="380" y2="120" stroke="var(--color-cyan)" strokeWidth="2" />
                            <line x1="220" y1="170" x2="380" y2="120" stroke="var(--color-red)" strokeWidth="2" />
                            <line x1="380" y1="120" x2="500" y2="120" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" />

                            {/* Pulsing signal on clean path */}
                            <circle cx="300" cy="95" r="4" fill="var(--color-cyan)">
                                <animate attributeName="cx" from="220" to="380" dur="2s" repeatCount="indefinite" />
                            </circle>

                            {/* Pulsing signal (slow) on degraded path */}
                            <circle cx="300" cy="145" r="4" fill="var(--color-red)">
                                <animate attributeName="cx" from="220" to="380" dur="4s" repeatCount="indefinite" />
                            </circle>

                            {/* Weather Station Node */}
                            <circle cx="80" cy="120" r="14" fill="#111" stroke="var(--color-gold)" strokeWidth="2" />
                            <text x="80" y="124" textAnchor="middle" fill="var(--color-gold)" className="mono" fontSize="9">MET</text>

                            {/* String 1 (Healthy) Node */}
                            <circle cx="220" cy="70" r="14" fill="#111" stroke="var(--color-cyan)" strokeWidth="2" />
                            <text x="220" y="74" textAnchor="middle" fill="var(--color-cyan)" className="mono" fontSize="9">STR1</text>

                            {/* String 4 (Anomalous) Node */}
                            <circle cx="220" cy="170" r="14" fill="#111" stroke="var(--color-red)" strokeWidth="2" />
                            <text x="220" y="174" textAnchor="middle" fill="var(--color-red)" className="mono" fontSize="9">STR4</text>

                            {/* Inverter Node */}
                            <circle cx="380" cy="120" r="16" fill="#111" stroke="var(--color-violet)" strokeWidth="2" />
                            <text x="380" y="124" textAnchor="middle" fill="var(--color-violet)" className="mono" fontSize="8">INV02</text>

                            {/* Local Grid Node */}
                            <circle cx="500" cy="120" r="14" fill="#111" stroke="#FFF" strokeWidth="1.5" />
                            <text x="500" y="124" textAnchor="middle" fill="#FFF" className="mono" fontSize="9">GRID</text>
                        </svg>
                    </div>
                )}

                {/* CAUSAL GRAPH VIEW */}
                {activeTab === 'causal' && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <span className="mono" style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                            Traces environmental indicators through physical operations to explain root-cause relationships.
                        </span>
                        <svg viewBox="0 0 600 240" style={{ width: '100%', height: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.04)' }}>

                            {/* Causal connections */}
                            <line x1="80" y1="60" x2="240" y2="90" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                            <line x1="80" y1="180" x2="240" y2="150" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                            <line x1="240" y1="90" x2="420" y2="120" stroke="var(--color-cyan)" strokeWidth="2" />
                            <line x1="240" y1="150" x2="420" y2="120" stroke="var(--color-amber)" strokeWidth="2" />

                            {/* Weather trigger Node */}
                            <rect x="30" y="40" width="100" height="40" rx="3" fill="#111" stroke="var(--color-amber)" strokeWidth="1" />
                            <text x="80" y="64" textAnchor="middle" fill="#FFF" className="mono" fontSize="9">Dust Accumulation</text>

                            {/* Electrical trigger Node */}
                            <rect x="30" y="160" width="100" height="40" rx="3" fill="#111" stroke="var(--color-red)" strokeWidth="1" />
                            <text x="80" y="184" textAnchor="middle" fill="#FFF" className="mono" fontSize="9">Grid Fluctuations</text>

                            {/* Array state Node */}
                            <rect x="190" y="70" width="100" height="40" rx="3" fill="#111" stroke="var(--color-cyan)'" strokeWidth="1" />
                            <text x="240" y="94" textAnchor="middle" fill="var(--color-cyan)" className="mono" fontSize="9">42% Soiling Index</text>

                            {/* Inverter state Node */}
                            <rect x="190" y="130" width="100" height="40" rx="3" fill="#111" stroke="var(--color-amber)" strokeWidth="1" />
                            <text x="240" y="154" textAnchor="middle" fill="var(--color-amber)" className="mono" fontSize="9">24% Grid Instability</text>

                            {/* Final Effect Node */}
                            <rect x="370" y="100" width="100" height="40" rx="3" fill="#111" stroke="var(--color-red)" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 10px rgba(255,0,60,0.2))' }} />
                            <text x="420" y="124" textAnchor="middle" fill="var(--color-red)" className="mono" fontSize="9" fontWeight="700">34 kWh GGI Loss</text>
                        </svg>
                    </div>
                )}

            </div>

        </div>
    );
}
