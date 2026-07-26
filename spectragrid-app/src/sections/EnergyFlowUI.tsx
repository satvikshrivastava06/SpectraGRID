export default function EnergyFlowUI() {
    return (
        <section id="energy-flow" className="section">
            <div className="section-inner">
                <div className="section-eyebrow">// Integrated IoT Telemetry</div>
                <h2 className="section-title">Telemetry Flow Topology</h2>
                <p className="section-subtitle">
                    Real-time updates from panel arrays and building grids flow continuously through our edge anomaly pipeline.
                </p>

                <div className="glass-panel" style={{ padding: '40px', marginTop: '40px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', position: 'relative' }}>

                        {/* Sun Node */}
                        <div style={{ textAlign: 'center', padding: '20px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px', background: 'rgba(255, 195, 0, 0.05)' }}>
                            <div className="mono" style={{ color: 'var(--color-gold)', fontSize: '0.8rem', marginBottom: '8px' }}>NODE_01</div>
                            <div style={{ fontWeight: 600 }}>SUN</div>
                            <div className="mono" style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '8px' }}>980 W/m²</div>
                        </div>

                        {/* Panels Node */}
                        <div style={{ textAlign: 'center', padding: '20px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px', background: 'rgba(0, 240, 255, 0.05)' }}>
                            <div className="mono" style={{ color: 'var(--color-cyan)', fontSize: '0.8rem', marginBottom: '8px' }}>NODE_02</div>
                            <div style={{ fontWeight: 600 }}>PANELS</div>
                            <div className="mono" style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '8px' }}>150 kWp</div>
                        </div>

                        {/* Inverter Node */}
                        <div style={{ textAlign: 'center', padding: '20px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px', background: 'rgba(157, 0, 255, 0.05)' }}>
                            <div className="mono" style={{ color: 'var(--color-violet)', fontSize: '0.8rem', marginBottom: '8px' }}>NODE_03</div>
                            <div style={{ fontWeight: 600 }}>INVERTERS</div>
                            <div className="mono" style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '8px' }}>92.4% EFF</div>
                        </div>

                        {/* Battery Node */}
                        <div style={{ textAlign: 'center', padding: '20px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px', background: 'rgba(0, 230, 118, 0.05)' }}>
                            <div className="mono" style={{ color: 'var(--color-emerald)', fontSize: '0.8rem', marginBottom: '8px' }}>NODE_04</div>
                            <div style={{ fontWeight: 600 }}>BATTERY</div>
                            <div className="mono" style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '8px' }}>84.1% SOH</div>
                        </div>

                        {/* Grid Node */}
                        <div style={{ textAlign: 'center', padding: '20px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.05)' }}>
                            <div className="mono" style={{ color: '#FFF', fontSize: '0.8rem', marginBottom: '8px' }}>NODE_05</div>
                            <div style={{ fontWeight: 600 }}>CAMPUS GRID</div>
                            <div className="mono" style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '8px' }}>50 Hz Sync</div>
                        </div>

                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '24px' }}>
                        <div className="mono" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                            Edge Telemetry Broker: Mosquitto MQTT
                        </div>
                        <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--color-cyan)' }}>
                            ONLINE // 25,000 PTS/SEC
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
