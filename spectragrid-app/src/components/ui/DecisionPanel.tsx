import { useState, useEffect } from 'react';
import { store, subscribe, type DecisionContext } from '../../store';

// ─── Question Card ─────────────────────────────────────────────────────────
function QuestionCard({
    number, question, answer, color, defaultOpen, options
}: {
    number: number; question: string; answer: string;
    color: string; defaultOpen?: boolean; options?: any[];
}) {
    const [open, setOpen] = useState(defaultOpen ?? false);
    const [selectedOpt, setSelectedOpt] = useState<number>(0);

    return (
        <div style={{
            border: `1px solid ${open ? color : 'rgba(255,255,255,0.06)'}`,
            borderRadius: '4px',
            overflow: 'hidden',
            transition: 'border-color 0.2s',
        }}>
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    width: '100%', textAlign: 'left', padding: '12px 14px',
                    background: open ? `${color}12` : 'rgba(255,255,255,0.02)',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    cursor: 'pointer', transition: 'background 0.2s',
                }}
            >
                <span className="mono" style={{
                    fontSize: '0.65rem', padding: '2px 6px', borderRadius: '3px',
                    background: color, color: '#000', fontWeight: 700, flexShrink: 0,
                }}>Q{number}</span>
                <span className="mono" style={{ fontSize: '0.78rem', color: '#FFF', fontWeight: 500 }}>{question}</span>
                <span style={{ marginLeft: 'auto', opacity: 0.4, fontSize: '0.7rem' }}>{open ? '▲' : '▼'}</span>
            </button>
            {open && (
                <div style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.2)' }}>
                    {options && options.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--color-emerald)', fontWeight: 600 }}>
                                RANKED INTERVENTION CANDIDATES ({options.length} OPTIONS):
                            </div>
                            {options.map((opt, idx) => (
                                <div
                                    key={opt.id || idx}
                                    onClick={() => setSelectedOpt(idx)}
                                    style={{
                                        padding: '10px 12px',
                                        borderRadius: '4px',
                                        background: selectedOpt === idx ? 'rgba(0, 230, 130, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                                        border: `1px solid ${selectedOpt === idx ? 'var(--color-emerald)' : 'rgba(255, 255, 255, 0.08)'}`,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <span className="mono" style={{ fontSize: '0.7rem', fontWeight: 700, color: selectedOpt === idx ? 'var(--color-emerald)' : '#FFF' }}>
                                            OPTION #{opt.rank || idx + 1} {idx === 0 ? '[RECOMMENDED]' : ''}
                                        </span>
                                        <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--color-cyan)' }}>
                                            {opt.confidence}% CONF
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '0.78rem', color: '#EEE', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                                        {opt.action}
                                    </p>
                                    <div className="mono" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '0.68rem', color: 'rgba(255,255,255,0.6)' }}>
                                        <div>Recovery: <span style={{ color: 'var(--color-emerald)', fontWeight: 600 }}>+{opt.expectedRecoveryKwh} kWh/d</span></div>
                                        <div>Cost: <span style={{ color: 'var(--color-amber)', fontWeight: 600 }}>₹{opt.cost.toLocaleString('en-IN')}</span></div>
                                        <div>Payback: <span style={{ color: '#FFF', fontWeight: 600 }}>{opt.paybackDays} days</span></div>
                                        <div>ROI: <span style={{ color: 'var(--color-cyan)', fontWeight: 600 }}>+{opt.roiPct}%</span></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: 0 }}>{answer}</p>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Confidence Arc ────────────────────────────────────────────────────────
function ConfidenceArc({ value, color }: { value: number; color: string }) {
    const r = 22, cx = 28, cy = 28;
    const circumference = Math.PI * r; // half circle
    const offset = circumference * (1 - value / 100);
    return (
        <svg width="56" height="34" viewBox="0 0 56 34">
            <path d={`M 6,28 A ${r},${r} 0 0,1 50,28`} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
            <path d={`M 6,28 A ${r},${r} 0 0,1 50,28`} fill="none" stroke={color}
                strokeWidth="4" strokeDasharray={`${circumference}`}
                strokeDashoffset={offset} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
            <text x={cx} y={cy - 4} textAnchor="middle" fill="#FFF"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700 }}>
                {value}%
            </text>
        </svg>
    );
}

// ─── Main Panel ────────────────────────────────────────────────────────────
export default function DecisionPanel() {
    const [visible, setVisible] = useState(true);
    const [ctx, setCtx] = useState<DecisionContext>(store.activeContext);

    // subscribe to store changes
    useEffect(() => {
        return subscribe(() => { setCtx({ ...store.activeContext }); });
    }, []);

    // keyboard toggle — press 'D'
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'd' || e.key === 'D') setVisible(v => !v);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const severityColor = ctx.severity === 'critical'
        ? 'var(--color-red)'
        : ctx.severity === 'warning'
            ? 'var(--color-amber)'
            : 'var(--color-emerald)';

    const panelWidth = 360;

    return (
        <>
            {/* ── Collapsed Tab ── */}
            {!visible && (
                <button
                    onClick={() => setVisible(true)}
                    className="mono"
                    style={{
                        position: 'fixed', right: 0, top: '50%', transform: 'translateY(-50%)',
                        zIndex: 9999, writingMode: 'vertical-lr', padding: '14px 8px',
                        background: severityColor, color: '#000', fontWeight: 700,
                        fontSize: '0.7rem', letterSpacing: '1px', borderRadius: '4px 0 0 4px',
                        cursor: 'pointer', boxShadow: `0 0 20px ${severityColor}55`,
                    }}
                >
                    ▶ DECISION INTEL [D]
                </button>
            )}

            {/* ── Full Panel ── */}
            {visible && (
                <div style={{
                    position: 'fixed', right: 0, top: 0, bottom: 0, width: `${panelWidth}px`,
                    zIndex: 9998,
                    background: 'rgba(10, 11, 16, 0.96)',
                    backdropFilter: 'blur(12px)',
                    borderLeft: `2px solid ${severityColor}`,
                    display: 'flex', flexDirection: 'column',
                    boxShadow: `-8px 0 40px ${severityColor}22`,
                    transition: 'border-color 0.4s, box-shadow 0.4s',
                    overflowY: 'auto',
                }}>

                    {/* Header */}
                    <div style={{
                        padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)',
                        display: 'flex', alignItems: 'center', gap: '10px',
                        background: `${severityColor}0a`,
                    }}>
                        <span style={{
                            width: '8px', height: '8px', borderRadius: '50%', background: severityColor, flexShrink: 0,
                            boxShadow: `0 0 8px ${severityColor}`, animation: ctx.severity === 'critical' ? 'pulse-glow 1.5s infinite' : 'none'
                        }} />
                        <div>
                            <div className="mono" style={{ fontSize: '0.65rem', opacity: 0.5, letterSpacing: '1px' }}>
                // DECISION INTELLIGENCE ENGINE
                            </div>
                            <div className="mono" style={{ fontSize: '0.82rem', color: severityColor, fontWeight: 600 }}>
                                {ctx.assetId.toUpperCase()} — {ctx.severity.toUpperCase()}
                            </div>
                        </div>
                        <button onClick={() => setVisible(false)} style={{ marginLeft: 'auto', background: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '1rem', cursor: 'pointer' }}>✕</button>
                    </div>

                    {/* Impact Badges */}
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <ConfidenceArc value={ctx.confidence} color={severityColor} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                            <div className="mono" style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ opacity: 0.5 }}>Financial Δ</span>
                                <span style={{ color: ctx.financialDelta < 0 ? 'var(--color-red)' : 'var(--color-emerald)', fontWeight: 600 }}>
                                    {ctx.financialDelta < 0 ? '−' : '+'}₹{Math.abs(ctx.financialDelta).toLocaleString('en-IN')}
                                </span>
                            </div>
                            <div className="mono" style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ opacity: 0.5 }}>Carbon Δ</span>
                                <span style={{ color: ctx.carbonDelta < 0 ? 'var(--color-red)' : 'var(--color-emerald)', fontWeight: 600 }}>
                                    {ctx.carbonDelta < 0 ? '−' : '+'}{Math.abs(ctx.carbonDelta)} tCO₂e
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 5 Questions */}
                    <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                        <QuestionCard number={1} question="What happened?" answer={ctx.what}
                            color="var(--color-cyan)" defaultOpen />
                        <QuestionCard number={2} question="Why did it happen?" answer={ctx.why}
                            color="var(--color-violet)" />
                        <QuestionCard number={3} question="What happens next?" answer={ctx.whatNext}
                            color="var(--color-amber)" />
                        <QuestionCard number={4} question="What should we do?" answer={ctx.action}
                            color="var(--color-emerald)" defaultOpen options={ctx.options} />
                        <QuestionCard number={5} question="What if we do nothing?" answer={ctx.doNothing}
                            color="var(--color-red)" />
                    </div>

                    {/* Action Footer */}
                    <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                        <button
                            className="mono"
                            onClick={() => {
                                const msg = `[WORK ORDER ISSUED]\n${ctx.action}\nAsset: ${ctx.assetId}\nConfidence: ${ctx.confidence}%`;
                                alert(msg);
                            }}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '4px', fontWeight: 700,
                                fontSize: '0.8rem', letterSpacing: '0.5px',
                                background: severityColor, color: '#000', cursor: 'pointer',
                                transition: 'opacity 0.2s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                        >
                            ↗ ISSUE WORK ORDER
                        </button>
                        <p className="mono" style={{ fontSize: '0.65rem', opacity: 0.3, textAlign: 'center', marginTop: '8px' }}>
                            Press [D] to toggle panel
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
