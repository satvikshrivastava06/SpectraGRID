import { useState } from 'react';
import { useStoreState } from '../store';

export default function AIConsoleUI() {
    const storeState = useStoreState();
    const ctx = storeState.activeContext;

    const [completedActions, setCompletedActions] = useState<string[]>([]);
    const isExecuted = completedActions.includes(ctx.action);

    const severityColor = ctx.severity === 'critical'
        ? 'var(--color-red)'
        : ctx.severity === 'warning'
            ? 'var(--color-amber)'
            : 'var(--color-emerald)';

    return (
        <section id="ai-console" className="section">
            <div className="section-inner" style={{ maxWidth: '1440px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
                    <div>
                        <div className="section-eyebrow">Decision Support</div>
                        <h2 className="section-title">AI Recommendation Console</h2>
                        <p className="section-subtitle">
                            Algorithms generate dynamic interventions based on real-time telemetry, model confidence variance, and financial recovery calculations.
                        </p>
                        <div style={{ marginTop: '20px', padding: '16px', borderRadius: '4px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <p className="mono font-semibold" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', margin: '0 0 8px 0' }}>CURRENT TARGET SYSTEM CONTEXT</p>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <span className="mono" style={{ fontSize: '1rem', color: 'var(--color-cyan)', fontWeight: 600 }}>{ctx.assetId.toUpperCase()}</span>
                                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '3px', background: severityColor, color: '#000', fontWeight: 700 }} className="mono">
                                    {ctx.severity.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Live Contextual AI Recommendation Box */}
                        <div className="glass-panel mono" style={{
                            padding: '24px',
                            borderLeft: `4px solid ${severityColor}`,
                            boxShadow: `0 4px 20px ${severityColor}10`,
                            transition: 'border-color 0.3s, box-shadow 0.3s'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px', marginBottom: '16px' }}>
                                <span style={{ color: severityColor, fontSize: '0.8rem', fontWeight: 600 }}>
                                    ACTIVE INSIGHT: {ctx.trigger.toUpperCase()}
                                </span>
                                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                                    CONFIDENCE: {ctx.confidence}%
                                </span>
                            </div>
                            <p style={{ color: '#FFF', fontSize: '1rem', fontWeight: 600, marginBottom: '16px', lineHeight: 1.4 }}>
                                {ctx.action}
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem', marginBottom: '20px' }}>
                                <div>
                                    <span style={{ color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '4px' }}>Financial Impact:</span>
                                    <span style={{ color: ctx.financialDelta < 0 ? 'var(--color-red)' : 'var(--color-emerald)', fontWeight: 700 }}>
                                        {ctx.financialDelta < 0 ? '−' : '+'}₹{Math.abs(ctx.financialDelta).toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <div>
                                    <span style={{ color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '4px' }}>Carbon Impact:</span>
                                    <span style={{ color: ctx.carbonDelta < 0 ? 'var(--color-red)' : 'var(--color-emerald)', fontWeight: 700 }}>
                                        {ctx.carbonDelta < 0 ? '−' : '+'}{Math.abs(ctx.carbonDelta).toFixed(1)} tCO₂
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => {
                                        if (isExecuted) return;
                                        setCompletedActions(prev => [...prev, ctx.action]);
                                        alert(`[ACCEPTED ACTION]\n${ctx.action}\nDispatched to O&M field ticketing service.`);
                                    }}
                                    disabled={isExecuted}
                                    style={{
                                        flex: 1, padding: '10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600,
                                        background: isExecuted ? 'rgba(255,255,255,0.04)' : 'var(--color-cyan)',
                                        color: isExecuted ? 'rgba(255,255,255,0.3)' : '#000',
                                        border: 'none', cursor: isExecuted ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {isExecuted ? '✓ DISPATCHED' : 'APPROVE & DISPATCH'}
                                </button>
                                <button
                                    style={{
                                        padding: '10px 14px', borderRadius: '4px', fontSize: '0.8rem',
                                        background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.6)',
                                        border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer'
                                    }}
                                    onClick={() => alert('Anomaly dismissed. Baselined parameters adjusted.')}
                                >
                                    DISMISS
                                </button>
                            </div>
                        </div>

                        {/* Static Backup Box */}
                        <div className="glass-panel mono" style={{ padding: '24px', borderLeft: '4px solid rgba(255,255,255,0.2)', opacity: 0.5 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px', marginBottom: '16px' }}>
                                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>HISTORIC MITIGATION #109</span>
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>RESOLVED</span>
                            </div>
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '12px' }}>
                                Frequency ride-through parameters calibrated for microgrid battery storage.
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                                <span style={{ color: 'rgba(255,255,255,0.4)' }}>Action date:</span>
                                <span style={{ color: '#FFF' }}>2026-07-15 15:32</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
