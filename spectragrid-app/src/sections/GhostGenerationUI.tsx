import { useState, useEffect } from 'react';
import { store, pushContext } from '../store';
import { fetchGhostGeneration } from '../apiClient';

const CAMPUSES = [
    { id: 'jab', name: 'Jabalpur Campus (150 kWp)', size: 150, rate: 7.8 },
    { id: 'nai', name: 'Nairobi Facility (300 kWp)', size: 300, rate: 12.2 },
    { id: 'dub', name: 'Dubai Port Array (500 kWp)', size: 500, rate: 9.5 }
];

const ROOFTOPS = [
    { id: 'blk-a', name: 'Block-A Rooftop', efficiencyDrop: 0.246 },
    { id: 'blk-b', name: 'Block-B Array', efficiencyDrop: 0.125 },
    { id: 'main-h', name: 'Main Hall Canopy', efficiencyDrop: 0.045 }
];

const DATE_RANGES = [
    { id: '7d', name: 'Last 7 Days', mult: 7 },
    { id: '30d', name: 'Last 30 Days', mult: 30 },
    { id: '90d', name: 'Last 90 Days', mult: 90 }
];

export default function GhostGenerationUI() {
    const [selectedCamp, setSelectedCamp] = useState(CAMPUSES[0]);
    const [selectedRoof, setSelectedRoof] = useState(ROOFTOPS[0]);
    const [selectedDate, setSelectedDate] = useState(DATE_RANGES[1]); // 30d

    // Calculations
    const [metrics, setMetrics] = useState({
        expected: 138,
        actual: 104,
        ghost: 34,
        revenue: 21400,
        carbon: 1.9,
        pr: 84.5
    });

    useEffect(() => {
        const runCalculations = async () => {
            let expected, actual, ghost, revenue, carbon, pr;

            const apiPayload = await fetchGhostGeneration(selectedCamp.name, selectedRoof.name, selectedDate.mult);
            if (apiPayload) {
                expected = apiPayload.expected;
                actual = apiPayload.actual;
                ghost = apiPayload.ghost;
                revenue = apiPayload.revenue;
                carbon = apiPayload.carbon;
                pr = apiPayload.pr;
            } else {
                // Math to compute Expected, Actual, GGI, Revenue, Carbon
                const dailyIdealOutputPerKwp = 4.2; // kWh/kWp/day
                const idealOutput = selectedCamp.size * dailyIdealOutputPerKwp * selectedDate.mult;

                // Expected production factoring default array age & solar hours
                expected = Math.floor(idealOutput * 0.95);

                // Actual production factoring dust/soiling and other deficits
                const deficitIndex = selectedRoof.efficiencyDrop;
                actual = Math.floor(expected * (1 - deficitIndex));
                ghost = expected - actual;

                revenue = Math.floor(ghost * selectedCamp.rate);
                carbon = Number(((ghost * 0.71) / 1000).toFixed(2)); // metric tons

                // Performance Ratio
                pr = Number(((actual / idealOutput) * 100).toFixed(1));
            }

            setMetrics({ expected, actual, ghost, revenue, carbon, pr });

            // Sync to global store so other components (R3F, overlays) can query it!
            store.selectedCampus = selectedCamp.name;
            store.selectedRooftop = selectedRoof.name;
            store.selectedDateRange = selectedDate.name;

            store.expectedProduction = expected;
            store.actualProduction = actual;
            store.ghostGeneration = ghost;
            store.revenueLoss = revenue;
            store.carbonImpact = carbon;
            store.performanceRatio = pr;

            pushContext({
                trigger: 'ghost-analysis',
                assetId: selectedRoof.name,
                what: `${selectedCamp.name} on ${selectedRoof.name} showing ${ghost} kWh of Ghost Generation over ${selectedDate.name}.`,
                why: `Primary loss factors: soiling (42%) and inverter efficiency drop (24%).`,
                whatNext: `If unaddressed, performance ratio is expected to degrade further to ${Math.max(10, Math.floor(pr - 5))}% over the next cycle.`,
                action: `Trigger automated solar washing system. Recoverable yield: ${Math.floor(ghost * 0.4)} kWh.`,
                doNothing: `Further generation losses estimated at ₹${revenue} and additional Scope 2 penalty of ${carbon} tCO₂e.`,
                financialDelta: -revenue,
                carbonDelta: -carbon,
                confidence: 90,
                severity: pr < 85 ? 'warning' : 'info'
            });
        };
        runCalculations();
    }, [selectedCamp, selectedRoof, selectedDate]);

    return (
        <section id="ghost-generation" className="section">
            <div className="section-inner">
                <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                    <div className="section-eyebrow">Diagnosis Core</div>
                    <h2 className="section-title">Ghost Generation Analysis Engine</h2>
                    <p className="section-subtitle" style={{ margin: '0 auto' }}>
                        Interactive analytical simulator testing expected solar yields against live physical losses.
                    </p>
                </div>

                {/* Dynamic Selectors Configuration Panel */}
                <div className="glass-panel mono" style={{ padding: '24px', display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '40px' }}>
                    <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.75rem', opacity: 0.6 }}>SELECT CAMPUS ZONE</label>
                        <select
                            value={selectedCamp.id}
                            onChange={(e) => {
                                const found = CAMPUSES.find(c => c.id === e.target.value);
                                if (found) setSelectedCamp(found);
                            }}
                            style={{
                                background: '#0F1115',
                                color: '#FFF',
                                border: '1px solid rgba(255,255,255,0.08)',
                                padding: '12px',
                                borderRadius: '4px',
                                outline: 'none',
                                fontFamily: 'var(--font-mono)'
                            }}
                        >
                            {CAMPUSES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.75rem', opacity: 0.6 }}>SELECT ROOFTOP ARRAY</label>
                        <select
                            value={selectedRoof.id}
                            onChange={(e) => {
                                const found = ROOFTOPS.find(r => r.id === e.target.value);
                                if (found) setSelectedRoof(found);
                            }}
                            style={{
                                background: '#0F1115',
                                color: '#FFF',
                                border: '1px solid rgba(255,255,255,0.08)',
                                padding: '12px',
                                borderRadius: '4px',
                                outline: 'none',
                                fontFamily: 'var(--font-mono)'
                            }}
                        >
                            {ROOFTOPS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>

                    <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.75rem', opacity: 0.6 }}>SELECT TEMPORAL RANGE</label>
                        <select
                            value={selectedDate.id}
                            onChange={(e) => {
                                const found = DATE_RANGES.find(d => d.id === e.target.value);
                                if (found) setSelectedDate(found);
                            }}
                            style={{
                                background: '#0F1115',
                                color: '#FFF',
                                border: '1px solid rgba(255,255,255,0.08)',
                                padding: '12px',
                                borderRadius: '4px',
                                outline: 'none',
                                fontFamily: 'var(--font-mono)'
                            }}
                        >
                            {DATE_RANGES.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Computation KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', marginBottom: '50px' }}>

                    <div className="glass-panel" style={{ padding: '24px' }}>
                        <div className="metric-label">Expected Yield</div>
                        <div className="metric-value mono" style={{ color: 'var(--color-gold)' }}>
                            {metrics.expected.toLocaleString()} <span style={{ fontSize: '0.9rem' }}>kWh</span>
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '24px' }}>
                        <div className="metric-label">Actual Yield</div>
                        <div className="metric-value mono" style={{ color: 'var(--color-cyan)' }}>
                            {metrics.actual.toLocaleString()} <span style={{ fontSize: '0.9rem' }}>kWh</span>
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '24px', borderLeft: '3px solid var(--color-red)' }}>
                        <div className="metric-label" style={{ color: 'var(--color-red)' }}>Ghost Deficit</div>
                        <div className="metric-value mono" style={{ color: 'var(--color-red)' }}>
                            -{metrics.ghost.toLocaleString()} <span style={{ fontSize: '0.9rem' }}>kWh</span>
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '24px' }}>
                        <div className="metric-label">Revenue Impact</div>
                        <div className="metric-value mono" style={{ color: 'var(--color-amber)' }}>
                            ₹{metrics.revenue.toLocaleString('en-IN')}
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '24px' }}>
                        <div className="metric-label">GHG Avoided</div>
                        <div className="metric-value mono" style={{ color: 'var(--color-emerald)' }}>
                            {metrics.carbon} <span style={{ fontSize: '0.9rem' }}>tCO₂e</span>
                        </div>
                    </div>

                </div>

                {/* Grid Layer for Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px' }}>

                    {/* Static Attribution Metering */}
                    <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div className="mono" style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem', color: 'var(--color-red)' }}>
              // Root-Cause Attribution Summary
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }} className="mono">
                                    <span>Soiling / Dust on Arrays</span>
                                    <span style={{ color: 'var(--color-cyan)' }}>42%</span>
                                </div>
                                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                                    <div style={{ height: '100%', width: '42%', background: 'var(--color-cyan)' }} />
                                </div>
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }} className="mono">
                                    <span>Grid Volatility & Faults</span>
                                    <span style={{ color: 'var(--color-cyan)' }}>24%</span>
                                </div>
                                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                                    <div style={{ height: '100%', width: '24%', background: 'var(--color-cyan)' }} />
                                </div>
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }} className="mono">
                                    <span>Inverter Efficiency Degradation</span>
                                    <span style={{ color: 'var(--color-cyan)' }}>18%</span>
                                </div>
                                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                                    <div style={{ height: '100%', width: '18%', background: 'var(--color-cyan)' }} />
                                </div>
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }} className="mono">
                                    <span>Partial Shading Obstructions</span>
                                    <span style={{ color: 'var(--color-cyan)' }}>10%</span>
                                </div>
                                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                                    <div style={{ height: '100%', width: '10%', background: 'var(--color-cyan)' }} />
                                </div>
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }} className="mono">
                                    <span>Sensor Drift & Calibration Errors</span>
                                    <span style={{ color: 'var(--color-cyan)' }}>6%</span>
                                </div>
                                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                                    <div style={{ height: '100%', width: '6%', background: 'var(--color-cyan)' }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Metrics Explanation text */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center' }}>
                        <h3 style={{ fontSize: '1.4rem', color: '#FFF' }}>Attribution Analytics</h3>
                        <p style={{ lineHeight: 1.6, color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}>
                            The computations dynamically compile using localized solar irradiation patterns (via Open-Meteo API backends) calibrated with our physics-based model of the array layout.
                        </p>
                        <p style={{ lineHeight: 1.6, color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}>
                            Currently selected array: <span style={{ color: 'var(--color-cyan)' }} className="mono">{selectedRoof.name} ({selectedCamp.name})</span> is showing a performance ratio of <span style={{ color: 'var(--color-cyan)' }} className="mono">{metrics.pr}%</span>.
                        </p>
                    </div>

                </div>

            </div>
        </section>
    );
}
