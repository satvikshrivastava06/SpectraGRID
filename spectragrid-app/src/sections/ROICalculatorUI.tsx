import { useState } from 'react';

export default function ROICalculatorUI() {
    const [size, setSize] = useState(150); // kWp

    const expectedYearlySaving = Math.floor(size * 213.3); // ₹ per year roughly
    const expectedCo2Saved = (size * 0.142).toFixed(1); // tCO2e roughly

    return (
        <section id="roi-calculator" className="section">
            <div className="section-inner">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
                    <div>
                        <div className="section-eyebrow">// Economic Justification</div>
                        <h2 className="section-title">ROI Recovery Estimator</h2>
                        <p className="section-subtitle">
                            Map the economic return of mitigating ghost generation at your facilities. Enter your solar campus size to calculate performance benefits.
                        </p>
                    </div>

                    <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div className="mono">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span>Campus Solar Asset Size</span>
                                <span style={{ color: 'var(--color-cyan)', fontWeight: 600 }}>{size} kWp</span>
                            </div>
                            <input
                                type="range"
                                min="50"
                                max="2000"
                                step="50"
                                value={size}
                                onChange={(e) => setSize(Number(e.target.value))}
                                style={{ width: '100%', accentColor: 'var(--color-cyan)', cursor: 'pointer' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="mono">
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                                <span>Estimated Annual Savings</span>
                                <span style={{ color: 'var(--color-emerald)', fontWeight: 600 }}>₹{expectedYearlySaving.toLocaleString('en-IN')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                                <span>Avoided Carbon Emissions</span>
                                <span style={{ color: 'var(--color-emerald)', fontWeight: 600 }}>{expectedCo2Saved} tCO₂e</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                                <span>Payback Duration</span>
                                <span style={{ color: '#FFF' }}>&lt; 4.2 Months</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
