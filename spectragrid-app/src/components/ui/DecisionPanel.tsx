import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { store, subscribe, useStoreState, scrollRef, type DecisionContext } from '../../store';
import { getEnvMode, ENV_PALETTE } from '../Navbar';

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
            border: `1px solid ${open ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)'}`,
            borderRadius: '10px',
            overflow: 'hidden',
            background: open ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.01)',
            transition: 'border-color 0.2s, background 0.2s',
        }}>
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    width: '100%', textAlign: 'left', padding: '12px 14px',
                    background: open ? 'rgba(255,255,255,0.03)' : 'transparent',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    cursor: 'pointer', transition: 'background 0.2s',
                    border: 'none',
                }}
            >
                <span className="mono" style={{
                    fontSize: '0.68rem', padding: '2px 7px', borderRadius: '4px',
                    background: `${color}20`, color: color, fontWeight: 700, flexShrink: 0,
                    border: `1px solid ${color}40`,
                }}>Q{number}</span>
                <span style={{ 
                    fontFamily: 'var(--font-brand, var(--font-sans))', 
                    fontSize: '0.82rem', color: '#FFF', fontWeight: 500, letterSpacing: '-0.01em' 
                }}>{question}</span>
                <motion.span 
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ marginLeft: 'auto', opacity: 0.4, fontSize: '0.7rem', display: 'flex', alignItems: 'center', color: '#FFF' }}
                >
                    ▼
                </motion.span>
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div 
                            className="custom-scroll"
                            onWheel={(e) => e.stopPropagation()}
                            style={{ 
                                padding: '14px', 
                                background: 'rgba(0,0,0,0.25)', 
                                borderTop: '1px solid rgba(255,255,255,0.04)',
                                maxHeight: '250px',
                                overflowY: 'auto',
                                overscrollBehavior: 'contain',
                            }}
                        >
                            {options && options.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--color-emerald)', fontWeight: 600, letterSpacing: '0.06em' }}>
                                        RANKED INTERVENTION CANDIDATES ({options.length} OPTIONS):
                                    </div>
                                    {options.map((opt, idx) => {
                                        const isSelected = selectedOpt === idx;
                                        return (
                                            <div
                                                key={opt.id || idx}
                                                onClick={() => setSelectedOpt(idx)}
                                                style={{
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    background: isSelected ? 'rgba(0, 230, 130, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                                                    border: `1px solid ${isSelected ? 'rgba(0, 230, 130, 0.4)' : 'rgba(255, 255, 255, 0.06)'}`,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
                                                    boxShadow: isSelected ? '0 4px 14px rgba(0, 230, 130, 0.1)' : 'none',
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                    <span className="mono" style={{ fontSize: '0.72rem', fontWeight: 700, color: isSelected ? 'var(--color-emerald)' : '#FFF' }}>
                                                        OPTION #{opt.rank || idx + 1} {idx === 0 ? '[RECOMMENDED]' : ''}
                                                    </span>
                                                    <span className="mono" style={{ 
                                                        fontSize: '0.65rem', 
                                                        color: 'var(--color-cyan)',
                                                        background: 'rgba(0, 240, 255, 0.1)',
                                                        padding: '1px 6px',
                                                        borderRadius: '3px',
                                                        border: '1px solid rgba(0, 240, 255, 0.25)'
                                                    }}>
                                                        {opt.confidence}% CONF
                                                    </span>
                                                </div>
                                                <p style={{ 
                                                    fontFamily: 'var(--font-sans)', 
                                                    fontSize: '0.8rem', 
                                                    color: 'rgba(255,255,255,0.85)', 
                                                    margin: '0 0 8px 0', 
                                                    lineHeight: 1.45 
                                                }}>
                                                    {opt.action}
                                                </p>
                                                <div className="mono" style={{ 
                                                    display: 'grid', 
                                                    gridTemplateColumns: '1fr 1fr', 
                                                    gap: '6px', 
                                                    fontSize: '0.68rem', 
                                                    color: 'rgba(255,255,255,0.5)',
                                                    background: 'rgba(0,0,0,0.2)',
                                                    padding: '8px 10px',
                                                    borderRadius: '6px'
                                                }}>
                                                    <div>Recovery: <span style={{ color: 'var(--color-emerald)', fontWeight: 600 }}>+{opt.expectedRecoveryKwh} kWh/d</span></div>
                                                    <div>Cost: <span style={{ color: 'var(--color-amber)', fontWeight: 600 }}>₹{opt.cost.toLocaleString('en-IN')}</span></div>
                                                    <div>Payback: <span style={{ color: '#FFF', fontWeight: 600 }}>{opt.paybackDays} days</span></div>
                                                    <div>ROI: <span style={{ color: 'var(--color-cyan)', fontWeight: 600 }}>+{opt.roiPct}%</span></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: 0 }}>
                                    {answer}
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
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
    const [scrollProgress, setScrollProgress] = useState(scrollRef.value);
    const { stage } = useStoreState();
    const panelRef = useRef<HTMLDivElement>(null);

    // Subscribe to store and scroll changes
    useEffect(() => {
        return subscribe(() => {
            setCtx({ ...store.activeContext });
            setScrollProgress(scrollRef.value);
        });
    }, []);

    // Block background wheel scrolling when cursor is over the decision panel
    useEffect(() => {
        const el = panelRef.current;
        if (!el) return;
        const handleWheel = (e: WheelEvent) => {
            e.stopPropagation();
        };
        el.addEventListener('wheel', handleWheel, { passive: true });
        return () => el.removeEventListener('wheel', handleWheel);
    }, [visible]);

    // keyboard toggle — press 'D'
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'd' || e.key === 'D') setVisible(v => !v);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const envMode = getEnvMode(stage, scrollProgress);
    const navPalette = ENV_PALETTE[envMode] || ENV_PALETTE.day;
    const navColor = navPalette.accent;
    const navColorRgb = navPalette.accentRgb;

    const severityColor = ctx.severity === 'critical'
        ? 'var(--color-red)'
        : ctx.severity === 'warning'
            ? 'var(--color-amber)'
            : 'var(--color-emerald)';

    const severityRgb = ctx.severity === 'critical'
        ? '255, 0, 60'
        : ctx.severity === 'warning'
            ? '255, 184, 0'
            : '0, 230, 118';

    const panelWidth = 420;

    return (
        <>
            {/* ── Collapsed Tab ── */}
            <AnimatePresence>
                {!visible && (
                    <motion.button
                        key="decision-collapsed-btn"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        whileHover={{ scale: 1.05, x: -4 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setVisible(true)}
                        style={{
                            position: 'fixed', right: 0, top: '50%', transform: 'translateY(-50%)',
                            zIndex: 9999, writingMode: 'vertical-lr', padding: '16px 10px',
                            background: 'linear-gradient(180deg, rgba(18, 20, 28, 0.94) 0%, rgba(10, 11, 16, 0.98) 100%)',
                            backdropFilter: 'blur(32px)',
                            WebkitBackdropFilter: 'blur(32px)',
                            border: `1px solid rgba(${navColorRgb}, 0.5)`,
                            borderRight: 'none',
                            color: navColor,
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.72rem', letterSpacing: '1.2px', borderRadius: '8px 0 0 8px',
                            cursor: 'pointer',
                            boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 24px rgba(${navColorRgb}, 0.35)`,
                            display: 'flex', alignItems: 'center', gap: '8px',
                            transition: 'color 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease',
                        }}
                    >
                        <span style={{
                            width: '7px', height: '7px', borderRadius: '50%', background: navColor,
                            boxShadow: `0 0 10px ${navColor}`,
                            display: 'inline-block',
                            transition: 'background 0.35s ease, box-shadow 0.35s ease',
                        }} />
                        DECISION INTEL [D]
                    </motion.button>
                )}
            </AnimatePresence>

            {/* ── Full Panel ── */}
            <AnimatePresence>
                {visible && (
                    <motion.div
                        ref={panelRef}
                        key="decision-panel-full"
                        className="custom-scroll"
                        initial={{ opacity: 0, x: 60, scale: 0.96, rotateY: -6 }}
                        animate={{ opacity: 1, x: 0, scale: 1, rotateY: 0 }}
                        exit={{ opacity: 0, x: 60, scale: 0.96, rotateY: -6 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.9 }}
                        style={{
                            position: 'fixed', right: '20px', top: '20px', bottom: '20px', width: `${panelWidth}px`,
                            maxWidth: 'calc(100vw - 40px)',
                            maxHeight: 'calc(100vh - 40px)',
                            zIndex: 9998,
                            background: 'linear-gradient(180deg, rgba(18, 20, 28, 0.95) 0%, rgba(10, 11, 16, 0.98) 100%)',
                            backdropFilter: 'blur(32px)',
                            WebkitBackdropFilter: 'blur(32px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '16px',
                            display: 'flex', flexDirection: 'column',
                            boxShadow: `0 40px 100px -20px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.05) inset, 0 10px 40px -10px rgba(${navColorRgb}, 0.25)`,
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            overscrollBehavior: 'contain',
                            transformPerspective: 1200,
                            transition: 'box-shadow 0.35s ease',
                        }}
                    >
                        {/* Premium ambient glow */}
                        <div style={{
                            position: 'absolute', top: -50, left: '15%', right: '15%', height: 110,
                            background: `radial-gradient(ellipse at top, rgba(${navColorRgb}, 0.22) 0%, transparent 70%)`,
                            pointerEvents: 'none', zIndex: 0,
                            transition: 'background 0.35s ease',
                        }} />

                        <div 
                            style={{ 
                                position: 'relative', 
                                zIndex: 1, 
                                display: 'flex', 
                                flexDirection: 'column', 
                                minHeight: '100%',
                            }}
                        >
                            {/* Sticky Header */}
                            <div style={{
                                position: 'sticky',
                                top: 0,
                                zIndex: 20,
                                flexShrink: 0,
                                padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                background: 'rgba(15, 17, 24, 0.96)',
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{
                                        width: '9px', height: '9px', borderRadius: '50%', background: navColor, flexShrink: 0,
                                        boxShadow: `0 0 12px ${navColor}`,
                                        transition: 'background 0.35s ease, box-shadow 0.35s ease',
                                    }} />
                                    <div>
                                        <div className="mono" style={{ 
                                            fontSize: '0.68rem', 
                                            color: navColor, 
                                            letterSpacing: '0.12em', 
                                            textTransform: 'uppercase',
                                            fontWeight: 700,
                                            textShadow: `0 0 14px rgba(${navColorRgb}, 0.45)`,
                                            transition: 'color 0.35s ease, text-shadow 0.35s ease',
                                        }}>
                                            DECISION INTEL
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                                            <h3 style={{
                                                fontFamily: 'var(--font-brand, var(--font-sans))',
                                                fontWeight: 600,
                                                fontSize: '1.15rem',
                                                color: '#fff',
                                                letterSpacing: '-0.01em',
                                                margin: 0
                                            }}>
                                                {ctx.assetId.toUpperCase()}
                                            </h3>
                                            <span style={{
                                                background: `rgba(${navColorRgb}, 0.12)`,
                                                border: `1px solid rgba(${navColorRgb}, 0.35)`,
                                                color: navColor,
                                                padding: '2px 7px',
                                                borderRadius: '4px',
                                                fontSize: '0.65rem',
                                                fontWeight: 700,
                                                fontFamily: 'var(--font-mono)',
                                                letterSpacing: '0.06em',
                                                textTransform: 'uppercase',
                                                transition: 'all 0.35s ease',
                                            }}>
                                                {ctx.severity}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setVisible(false)} 
                                    style={{ 
                                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
                                        color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '1.1rem', 
                                        lineHeight: 1, width: 32, height: 32, borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)';
                                        (e.currentTarget as HTMLElement).style.color = '#fff';
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                                        (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)';
                                    }}
                                >✕</button>
                            </div>


                            {/* Impact Badges */}
                            <div style={{ 
                                flexShrink: 0,
                                padding: '16px 24px', 
                                borderBottom: '1px solid rgba(255,255,255,0.06)', 
                                display: 'flex', 
                                gap: '16px', 
                                alignItems: 'center',
                                background: 'rgba(255,255,255,0.015)'
                            }}>
                                <ConfidenceArc value={ctx.confidence} color={severityColor} />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                                    <div className="mono" style={{ 
                                        fontSize: '0.75rem', 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        background: 'rgba(0,0,0,0.2)',
                                        padding: '6px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(255,255,255,0.04)'
                                    }}>
                                        <span style={{ color: 'rgba(255,255,255,0.45)' }}>Financial Δ</span>
                                        <span style={{ color: ctx.financialDelta < 0 ? 'var(--color-red)' : 'var(--color-emerald)', fontWeight: 600 }}>
                                            {ctx.financialDelta < 0 ? '−' : '+'}₹{Math.abs(ctx.financialDelta).toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                    <div className="mono" style={{ 
                                        fontSize: '0.75rem', 
                                        display: 'flex', 
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        background: 'rgba(0,0,0,0.2)',
                                        padding: '6px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(255,255,255,0.04)'
                                    }}>
                                        <span style={{ color: 'rgba(255,255,255,0.45)' }}>Carbon Δ</span>
                                        <span style={{ color: ctx.carbonDelta < 0 ? 'var(--color-red)' : 'var(--color-emerald)', fontWeight: 600 }}>
                                            {ctx.carbonDelta < 0 ? '−' : '+'}{Math.abs(ctx.carbonDelta)} tCO₂e
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* 5 Questions */}
                            <div 
                                style={{ 
                                    padding: '16px 20px', 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    gap: '10px', 
                                    flex: '1 0 auto',
                                }}
                            >
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
                            <div style={{ 
                                marginTop: 'auto',
                                padding: '18px 24px', 
                                borderTop: '1px solid rgba(255,255,255,0.07)',
                                background: 'rgba(10, 11, 16, 0.4)'
                            }}>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="mono"
                                    onClick={() => {
                                        const msg = `[WORK ORDER ISSUED]\n${ctx.action}\nAsset: ${ctx.assetId}\nConfidence: ${ctx.confidence}%`;
                                        alert(msg);
                                    }}
                                    style={{
                                        width: '100%', padding: '14px', borderRadius: '8px', fontWeight: 700,
                                        fontSize: '0.82rem', letterSpacing: '0.04em',
                                        background: severityColor, color: '#000', cursor: 'pointer',
                                        border: 'none',
                                        transition: 'background 0.2s',
                                        boxShadow: `0 8px 24px -6px rgba(${severityRgb}, 0.5), inset 0 1px 0 rgba(255,255,255,0.4)`,
                                    }}
                                >
                                    ↗ ISSUE WORK ORDER
                                </motion.button>
                                <p className="mono" style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                                    <span>Press</span>
                                    <span style={{ 
                                        background: 'rgba(255,255,255,0.08)', 
                                        border: '1px solid rgba(255,255,255,0.15)', 
                                        borderRadius: '3px', 
                                        padding: '1px 5px', 
                                        color: '#FFF',
                                        fontSize: '0.62rem'
                                    }}>D</span>
                                    <span>to toggle panel</span>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
