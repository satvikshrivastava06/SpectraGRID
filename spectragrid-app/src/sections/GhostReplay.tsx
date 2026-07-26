import { useState } from 'react';

export default function GhostReplay() {
    const [timeline, setTimeline] = useState(0);

    return (
        <div className="glass-panel" style={{
            position: 'fixed',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '800px',
            padding: '24px',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            zIndex: 100
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="mono" style={{ color: 'var(--color-cyan)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Ghost Replay™
                </h3>
                <span className="mono" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                    {new Date(Date.now() - (100 - timeline) * 3600000).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>

            <div style={{ position: 'relative', width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: timeline + '%', background: 'var(--color-cyan)', borderRadius: '2px' }} />
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={timeline}
                    onChange={(e) => setTimeline(Number(e.target.value))}
                    style={{
                        position: 'absolute',
                        top: '-8px',
                        left: 0,
                        width: '100%',
                        opacity: 0,
                        cursor: 'pointer'
                    }}
                />
                <div style={{
                    position: 'absolute',
                    top: '-6px',
                    left: 'calc(' + timeline + '% - 8px)',
                    width: '16px',
                    height: '16px',
                    background: '#FFF',
                    borderRadius: '50%',
                    boxShadow: '0 0 10px var(--color-cyan)',
                    pointerEvents: 'none'
                }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>EXPECTED GENERATION</span>
                    <span className="mono" style={{ fontSize: '1.2rem', color: '#FFF' }}>138 kWh</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>ACTUAL GENERATION</span>
                    <span className="mono" style={{ fontSize: '1.2rem', color: '#FFF' }}>{138 - Math.floor((timeline / 100) * 34)} kWh</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-red)' }}>GHOST GENERATION</span>
                    <span className="mono" style={{ fontSize: '1.2rem', color: 'var(--color-red)' }}>{Math.floor((timeline / 100) * 34)} kWh</span>
                </div>
            </div>
        </div>
    );
}
