import { useState } from 'react';
import { pushContext } from '../../store';

type Incident = {
    id: string;
    timestamp: string;
    node: string;
    severity: 'warning' | 'critical' | 'info';
    message: string;
    status: 'active' | 'mitigating' | 'resolved';
};

const INITIAL_INCIDENTS: Incident[] = [
    {
        id: 'INC-204',
        timestamp: '18:42:01',
        node: 'Inverter 02',
        severity: 'warning',
        message: 'Thermal degradation anomaly detected. Internal temperature exceeded 72°C.',
        status: 'active'
    },
    {
        id: 'INC-203',
        timestamp: '17:15:30',
        node: 'String 04 / Panel B12',
        severity: 'critical',
        message: 'Voltage drop below 12V. Expected 32V under current irradiance. Unscheduled soiling flagged.',
        status: 'active'
    },
    {
        id: 'INC-198',
        timestamp: '15:30:10',
        node: 'Grid Connection',
        severity: 'info',
        message: 'Frequency sync stabilizer active. Grid fluctuating between 49.8Hz and 50.2Hz.',
        status: 'resolved'
    }
];

import { updateAlertStatus } from '../../apiClient';

export default function IncidentTimeline() {
    const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);

    const resolveIncident = (id: string) => {
        setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: 'resolved' } : inc));
        updateAlertStatus(id, 'resolved');
    };

    return (
        <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="mono" style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem', color: 'var(--color-cyan)' }}>
          // Live Incident Log
                </span>
                <span className="badge badge-red mono" style={{ animation: 'pulse-glow 2s infinite' }}>
                    {incidents.filter(i => i.status === 'active').length} Active Alerts
                </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {incidents.map(inc => (
                    <div key={inc.id}
                        onClick={() => {
                            if (inc.id === 'INC-204') {
                                pushContext({
                                    trigger: 'incident',
                                    assetId: 'Inverter 02',
                                    what: 'Thermal degradation alert INC-204 active. Internal temp exceeded 72°C.',
                                    why: 'Aged heat sink capacitors and cooling fan failure. SHAP registers -34% fan speed decay.',
                                    whatNext: 'Probability of grid failure within 24 hours: 74% if unmitigated.',
                                    action: 'Deploy crew to clean fan filter and replace filter capacitor immediately.',
                                    doNothing: 'Capacitor burn out cost: ₹18.5k (repair) + ₹50k (lost yield) + 3.4 tCO₂e Scope 2 liability.',
                                    financialDelta: -45000,
                                    carbonDelta: -3.4,
                                    confidence: 93,
                                    severity: 'critical'
                                });
                            } else if (inc.id === 'INC-203') {
                                pushContext({
                                    trigger: 'incident',
                                    assetId: 'Panel B12',
                                    what: 'Panel voltage drop alert INC-203 active. Output below 12V.',
                                    why: 'Bypass diode short-circuit combined with heavy surface dust load on Array B3.',
                                    whatNext: 'Cascading voltage restriction limits String 4 yield. Daily loss compounds.',
                                    action: 'Clean Array B3 panels and replace faulty bypass diode in junction box.',
                                    doNothing: '30-day cumulative loss: ₹12k revenue and 0.4 tCO₂e Scope 2 penalty.',
                                    financialDelta: -4200,
                                    carbonDelta: -0.4,
                                    confidence: 95,
                                    severity: 'critical'
                                });
                            } else {
                                pushContext({
                                    trigger: 'incident',
                                    assetId: 'Grid Connection',
                                    what: 'Frequency sync alert INC-198 resolved. Frequency stabilized.',
                                    why: 'Phase lock loop PLL micro-grid batteries engaged to ride through utility load surge.',
                                    whatNext: 'System returned to steady state. Standard frequency tracking active.',
                                    action: 'Resume normal monitoring. No active maintenance needed.',
                                    doNothing: 'Resolved. No immediate action required.',
                                    financialDelta: 0,
                                    carbonDelta: 0,
                                    confidence: 98,
                                    severity: 'info'
                                });
                            }
                        }}
                        style={{
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '4px',
                            padding: '16px',
                            background: inc.status === 'resolved' ? 'rgba(255,255,255,0.01)' : 'rgba(15, 17, 21, 0.4)',
                            opacity: inc.status === 'resolved' ? 0.6 : 1,
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-cyan)')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }} className="mono">
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <span style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: inc.severity === 'critical' ? 'var(--color-red)' : inc.severity === 'warning' ? 'var(--color-amber)' : 'var(--color-cyan)',
                                    boxShadow: inc.severity === 'critical' ? 'var(--glow-red)' : 'none'
                                }} />
                                <span style={{ fontWeight: 600, color: '#FFF' }}>{inc.id} - {inc.node}</span>
                            </div>
                            <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>{inc.timestamp}</span>
                        </div>

                        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', marginBottom: '12px', lineHeight: 1.4 }}>
                            {inc.message}
                        </p>

                        <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="mono" style={{
                                fontSize: '0.75rem',
                                textTransform: 'uppercase',
                                color: inc.status === 'resolved' ? 'var(--color-emerald)' : 'var(--color-amber)'
                            }}>
                                STATE: {inc.status}
                            </span>

                            {inc.status !== 'resolved' && (
                                <button
                                    onClick={() => resolveIncident(inc.id)}
                                    className="btn-primary mono"
                                    style={{ fontSize: '0.7rem', padding: '4px 10px', background: 'var(--color-cyan)', color: '#000' }}
                                >
                                    ACK RESOLVED
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
