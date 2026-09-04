import { useState, useEffect, useRef } from 'react';

// ─── Sparkline component ───────────────────────────────────────────────────
function SparkLine({ values, color, height = 40 }: { values: number[]; color: string; height?: number }) {
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const w = 100;
    const pts = values.map((v, i) => {
        const x = (i / (values.length - 1)) * w;
        const y = height - ((v - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg viewBox={`0 0 ${w} ${height}`} style={{ width: '100%', height: `${height}px` }} preserveAspectRatio="none">
            <defs>
                <linearGradient id={`spark-fill-${color.replace(/[^a-z]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.15" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polyline points={`${pts} 100,${height} 0,${height}`}
                fill={`url(#spark-fill-${color.replace(/[^a-z]/gi, '')})`} stroke="none" />
            <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" />
        </svg>
    );
}

// ─── Metric Card with live sparkline ─────────────────────────────────────────
function MetricCard({
    label, unit, value, color, history, status
}: {
    label: string; unit: string; value: number | string;
    color: string; history: number[]; status?: 'ok' | 'warn' | 'critical';
}) {
    const statusColor = status === 'critical' ? 'var(--color-red)' : status === 'warn' ? 'var(--color-amber)' : 'var(--color-emerald)';
    return (
        <div className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="mono" style={{ fontSize: '0.7rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
                {status && (
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
                )}
            </div>
            <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 700, color }}>
                {value}<span style={{ fontSize: '0.8rem', opacity: 0.6, marginLeft: '4px' }}>{unit}</span>
            </div>
            <SparkLine values={history} color={color} height={32} />
        </div>
    );
}

// ─── Latency Gauge Bar ────────────────────────────────────────────────────
function LatencyBar({ label, value, max, unit, color }: {
    label: string; value: number; max: number; unit: string; color: string;
}) {
    const pct = Math.min(100, (value / max) * 100);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }} className="mono">
                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{label}</span>
                <span style={{ fontSize: '0.8rem', color, fontWeight: 600 }}>{value}{unit}</span>
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '2px', transition: 'width 0.5s' }} />
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────
export default function ArchitectureUI() {
    // Simulated live SRE metrics
    const [metrics, setMetrics] = useState({
        mqttRate: 342,           // msgs/s
        telemetryLag: 48,        // ms
        eventThroughput: 1240,   // events/s
        anomalyLatency: 82,      // ms
        predictionLatency: 210,  // ms
        modelConfidence: 94.2,   // %
        inferenceCost: 0.0012,   // $/inference
    });

    // Rolling history buffers
    const hist = useRef({
        mqtt: Array(30).fill(340),
        lag: Array(30).fill(50),
        throughput: Array(30).fill(1200),
        anomaly: Array(30).fill(80),
        predict: Array(30).fill(210),
        confidence: Array(30).fill(94),
        cost: Array(30).fill(0.0012),
    });
    const [, rerender] = useState(0);

    useEffect(() => {
        const id = setInterval(() => {
            const walk = (v: number, amp: number, min: number, max: number) =>
                Math.max(min, Math.min(max, v + (Math.random() - 0.5) * amp));

            setMetrics(m => {
                const next = {
                    mqttRate: walk(m.mqttRate, 30, 200, 500),
                    telemetryLag: walk(m.telemetryLag, 8, 20, 150),
                    eventThroughput: walk(m.eventThroughput, 100, 800, 2000),
                    anomalyLatency: walk(m.anomalyLatency, 12, 30, 200),
                    predictionLatency: walk(m.predictionLatency, 20, 90, 400),
                    modelConfidence: walk(m.modelConfidence, 1.2, 75, 99.9),
                    inferenceCost: Number(walk(m.inferenceCost * 1000, 0.08, 0.3, 3) / 1000).toFixed(4) as unknown as number,
                };
                hist.current.mqtt = [...hist.current.mqtt.slice(1), next.mqttRate];
                hist.current.lag = [...hist.current.lag.slice(1), next.telemetryLag];
                hist.current.throughput = [...hist.current.throughput.slice(1), next.eventThroughput];
                hist.current.anomaly = [...hist.current.anomaly.slice(1), next.anomalyLatency];
                hist.current.predict = [...hist.current.predict.slice(1), next.predictionLatency];
                hist.current.confidence = [...hist.current.confidence.slice(1), next.modelConfidence];
                hist.current.cost = [...hist.current.cost.slice(1), Number(next.inferenceCost)];
                return next;
            });
            rerender(n => n + 1);
        }, 1600);
        return () => clearInterval(id);
    }, []);

    const lagStatus = metrics.telemetryLag > 100 ? 'critical' : metrics.telemetryLag > 70 ? 'warn' : 'ok';
    const confStatus = metrics.modelConfidence < 80 ? 'critical' : metrics.modelConfidence < 88 ? 'warn' : 'ok';

    return (
        <section id="observability" className="section">
            <div className="section-inner" style={{ maxWidth: '1440px' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                    <div className="section-eyebrow">SRE Command</div>
                    <h2 className="section-title">Infrastructure Observability</h2>
                    <p className="section-subtitle" style={{ margin: '0 auto', maxWidth: '560px' }}>
                        Real-time platform telemetry monitoring SpectraGRID's IoT ingestion pipeline, ML inference engine, and edge device fleet.
                    </p>
                </div>

                {/* System Status Bar */}
                <div className="glass-panel mono" style={{
                    padding: '12px 24px', marginBottom: '32px',
                    display: 'flex', gap: '32px', alignItems: 'center',
                    background: 'rgba(0, 230, 130, 0.04)',
                    borderLeft: '3px solid var(--color-emerald)'
                }}>
                    <span style={{ color: 'var(--color-emerald)', fontWeight: 600, fontSize: '0.85rem' }}>● SYSTEM NOMINAL</span>
                    <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>Last heartbeat: {new Date().toLocaleTimeString()}</span>
                    <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>Edge nodes: <span style={{ color: '#FFF' }}>12/12 online</span></span>
                    <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>Model version: <span style={{ color: '#FFF' }}>spectra-v2.4.1</span></span>
                    <span style={{ opacity: 0.5, fontSize: '0.8rem', marginLeft: 'auto' }}>Simulated MQTT broker • Modbus RTU pipeline</span>
                </div>

                {/* Top row: 4 live throughput metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                    <MetricCard
                        label="MQTT Ingestion Rate" unit="msg/s"
                        value={Math.floor(metrics.mqttRate)} color="var(--color-cyan)"
                        history={hist.current.mqtt} status="ok"
                    />
                    <MetricCard
                        label="Telemetry Pipeline Lag" unit="ms"
                        value={Math.floor(metrics.telemetryLag)} color={metrics.telemetryLag > 80 ? 'var(--color-red)' : 'var(--color-gold)'}
                        history={hist.current.lag} status={lagStatus}
                    />
                    <MetricCard
                        label="Event Throughput" unit="evt/s"
                        value={Math.floor(metrics.eventThroughput)} color="var(--color-violet)"
                        history={hist.current.throughput} status="ok"
                    />
                    <MetricCard
                        label="Model Confidence" unit="%"
                        value={metrics.modelConfidence.toFixed(1)} color={metrics.modelConfidence < 85 ? 'var(--color-red)' : 'var(--color-emerald)'}
                        history={hist.current.confidence} status={confStatus}
                    />
                </div>

                {/* Bottom: latency gauges + inference cost + stack info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>

                    {/* Latency gauges */}
                    <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="mono" style={{ fontSize: '0.8rem', letterSpacing: '1px', opacity: 0.5, marginBottom: '4px' }}>
              // INFERENCE LATENCIES
                        </div>
                        <LatencyBar
                            label="Anomaly Detection" value={Math.floor(metrics.anomalyLatency)} max={200} unit=" ms"
                            color={metrics.anomalyLatency > 150 ? 'var(--color-red)' : 'var(--color-cyan)'}
                        />
                        <LatencyBar
                            label="Prediction Engine" value={Math.floor(metrics.predictionLatency)} max={400} unit=" ms"
                            color={metrics.predictionLatency > 300 ? 'var(--color-amber)' : 'var(--color-violet)'}
                        />
                        <LatencyBar
                            label="Telemetry Lag" value={Math.floor(metrics.telemetryLag)} max={150} unit=" ms"
                            color={metrics.telemetryLag > 100 ? 'var(--color-red)' : 'var(--color-emerald)'}
                        />

                        <div className="mono" style={{ fontSize: '0.8rem', letterSpacing: '1px', opacity: 0.5, marginTop: '8px', marginBottom: '4px' }}>
              // INFERENCE COST
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="mono" style={{ fontSize: '0.85rem', opacity: 0.7 }}>Cost per inference</span>
                            <span className="mono" style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-gold)' }}>
                                ${Number(metrics.inferenceCost).toFixed(4)}
                            </span>
                        </div>
                        <SparkLine values={hist.current.cost.map(v => v * 1000)} color="var(--color-gold)" height={32} />
                    </div>

                    {/* Event throughput extended sparkline */}
                    <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="mono" style={{ fontSize: '0.8rem', letterSpacing: '1px', opacity: 0.5, marginBottom: '4px' }}>
              // MQTT BROKER ACTIVITY
                        </div>
                        <SparkLine values={hist.current.mqtt} color="var(--color-cyan)" height={80} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <div className="mono" style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '4px' }}>PEAK</div>
                                <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-cyan)' }}>
                                    {Math.max(...hist.current.mqtt).toFixed(0)} msg/s
                                </div>
                            </div>
                            <div>
                                <div className="mono" style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '4px' }}>AVG (30s)</div>
                                <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 600, color: '#FFF' }}>
                                    {(hist.current.mqtt.reduce((a, b) => a + b, 0) / 30).toFixed(0)} msg/s
                                </div>
                            </div>
                        </div>
                        <div className="mono" style={{ fontSize: '0.75rem', opacity: 0.4, lineHeight: 1.5 }}>
                            Eclipse Mosquitto v2.0 broker. QoS 1 subscriber pool. Topics: spectragrid/#
                        </div>
                    </div>

                    {/* Tech stack info */}
                    <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div className="mono" style={{ fontSize: '0.8rem', letterSpacing: '1px', opacity: 0.5, marginBottom: '4px' }}>
              // DEPLOYMENT TOPOLOGY
                        </div>
                        {[
                            { label: 'Database', proto: 'Neon Postgres', ent: 'Aurora Serverless v2', color: 'var(--color-cyan)' },
                            { label: 'Time-series', proto: 'TimescaleDB', ent: 'Timescale Cloud', color: 'var(--color-violet)' },
                            { label: 'Event Bus', proto: 'Upstash Redis', ent: 'Apache Kafka / MSK', color: 'var(--color-gold)' },
                            { label: 'IoT Broker', proto: 'Mosquitto MQTT', ent: 'AWS IoT Core', color: 'var(--color-emerald)' },
                            { label: 'ML Serving', proto: 'FastAPI + ONNX', ent: 'SageMaker Endpoints', color: 'var(--color-red)' },
                        ].map(row => (
                            <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 1fr', gap: '8px', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <span className="mono" style={{ fontSize: '0.7rem', opacity: 0.5 }}>{row.label}</span>
                                <span className="mono" style={{ fontSize: '0.78rem', color: row.color }}>{row.proto}</span>
                                <span className="mono" style={{ fontSize: '0.78rem', opacity: 0.4 }}>{row.ent}</span>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </section>
    );
}
