export default function PredictiveMaintenanceUI() {
    return (
        <section id="predictive" className="section">
            <div className="section-inner">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
                    <div>
                        <div className="section-eyebrow">Asset Degradation Models</div>
                        <h2 className="section-title">Predictive Operations</h2>
                        <p className="section-subtitle">
                            Estimated maintenance horizons and failure timelines are continuously calculated using degradation models to plan maintenance windows before catastrophic failure.
                        </p>
                    </div>

                    <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div className="mono" style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem', color: 'var(--color-cyan)' }}>
              // Inverter_02 Health Assessment
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="mono">
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span>Current State of Health</span>
                                    <span style={{ color: 'var(--color-cyan)' }}>84.1%</span>
                                </div>
                                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px' }}>
                                    <div style={{ height: '100%', width: '84.1%', background: 'var(--color-cyan)' }} />
                                </div>
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span>Failure Probability (90 Day)</span>
                                    <span style={{ color: 'var(--color-amber)' }}>14%</span>
                                </div>
                                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px' }}>
                                    <div style={{ height: '100%', width: '14%', background: 'var(--color-amber)' }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <span>Intervention Window</span>
                                <span style={{ color: '#FFF' }}>Sep 12 - Sep 20</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <span>Estimated Maintenance Horizon</span>
                                <span style={{ color: 'var(--color-emerald)' }}>3.2 Years</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
