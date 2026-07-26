import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * CommandCenterTransition
 * Plays a 1.2–1.5 s cinematic transition:
 *   page collapses → camera pulls up → campus miniature → energy net → CC locks in
 */
export default function CommandCenterTransition({
    onComplete,
    accent = '#00F0FF',
    accentRgb = '0, 240, 255',
}: {
    onComplete: () => void;
    accent?: string;
    accentRgb?: string;
}) {
    const [phase, setPhase] = useState<0 | 1 | 2 | 3 | 4>(0);

    useEffect(() => {
        // Phase sequence
        const timings = [0, 250, 550, 850, 1150];
        const ids = timings.map((t, i) => setTimeout(() => setPhase(i as any), t));
        const done = setTimeout(onComplete, 1550);
        return () => { ids.forEach(clearTimeout); clearTimeout(done); };
    }, [onComplete]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
                position: 'fixed', inset: 0, zIndex: 1999,
                background: '#080A10',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: '24px',
                overflow: 'hidden',
            }}
        >
            {/* Grid bg */}
            <div style={{
                position: 'absolute', inset: 0, opacity: 0.06,
                backgroundImage: `linear-gradient(rgba(${accentRgb},0.8) 1px, transparent 1px),linear-gradient(90deg, rgba(${accentRgb},0.8) 1px, transparent 1px)`,
                backgroundSize: '48px 48px',
                animation: phase >= 2 ? 'ct-grid-zoom 0.6s ease-in forwards' : 'none',
            }} />

            <style>{`
        @keyframes ct-grid-zoom { from{transform:scale(1)} to{transform:scale(1.8) translateY(-10%)} }
        @keyframes ct-campus-rise { from{opacity:0;transform:translateY(30px) scale(0.85)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes ct-energy-pulse { 0%{opacity:0} 50%{opacity:1} 100%{opacity:0.7} }
        @keyframes ct-lock { from{opacity:0;letter-spacing:0.5em} to{opacity:1;letter-spacing:0.18em} }
        @keyframes ct-scan { 0%{left:-40%} 100%{left:120%} }
      `}</style>

            {/* Phase 1 — Label */}
            <AnimatePresence>
                {phase >= 0 && phase < 3 && (
                    <motion.div
                        key="p0"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: `rgba(${accentRgb},0.5)`, letterSpacing: '0.22em', textTransform: 'uppercase' }}
                    >
                        {phase === 0 ? 'INITIALIZING DIGITAL TWIN...' : phase === 1 ? 'CONNECTING TO CAMPUS SENSORS...' : 'ENERGY NETWORK ACTIVATING...'}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Phase 2 — Campus miniature */}
            <AnimatePresence>
                {phase >= 2 && phase < 4 && (
                    <motion.div
                        key="campus"
                        initial={{ opacity: 0, scale: 0.7, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.3 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        style={{ display: 'flex', gap: '24px', alignItems: 'flex-end' }}
                    >
                        {[
                            { label: 'Block A', h: 90, c: accent, glow: true },
                            { label: 'Library', h: 60, c: `rgba(${accentRgb},0.6)`, glow: false },
                            { label: 'Hangar', h: 44, c: `rgba(${accentRgb},0.45)`, glow: false },
                        ].map((b, bi) => (
                            <div key={b.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', animationDelay: `${bi * 80}ms` }}>
                                {/* Panels */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2px', marginBottom: '2px' }}>
                                    {Array.from({ length: 8 }).map((_, pi) => (
                                        <div key={pi} style={{
                                            width: 14, height: 9, borderRadius: '1px',
                                            background: b.glow && pi > 5 ? 'rgba(255,80,80,0.6)' : `rgba(${accentRgb},0.3)`,
                                            border: `1px solid ${b.glow && pi > 5 ? 'rgba(255,80,80,0.7)' : `rgba(${accentRgb},0.5)`}`,
                                        }} />
                                    ))}
                                </div>
                                {/* Building */}
                                <div style={{
                                    width: 64, height: b.h,
                                    background: b.glow ? `linear-gradient(180deg, rgba(${accentRgb},0.12) 0%, rgba(20,22,35,0.95) 100%)` : 'rgba(20,22,35,0.9)',
                                    border: `1px solid ${b.c}`,
                                    borderRadius: '2px 2px 0 0',
                                    boxShadow: b.glow ? `0 0 30px rgba(${accentRgb},0.3), inset 0 0 20px rgba(${accentRgb},0.05)` : 'none',
                                }} />
                                <div style={{ width: 80, height: 2, background: `rgba(${accentRgb},0.15)` }} />
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: `rgba(${accentRgb},0.5)` }}>{b.label}</span>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Phase 3 — Energy pulses */}
            <AnimatePresence>
                {phase >= 3 && (
                    <motion.div
                        key="energy"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}
                    >
                        {['☀', '→→', 'PANELS', '→→', 'INVERTER', '→→', 'GRID'].map((s, i) => (
                            <motion.span
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.06 }}
                                style={{ color: i === 0 ? '#FFD700' : i % 2 === 0 ? accent : `rgba(${accentRgb},0.4)` }}
                            >
                                {s}
                            </motion.span>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Phase 4 — COMMAND CENTER lock */}
            <AnimatePresence>
                {phase >= 4 && (
                    <motion.div
                        key="lock"
                        initial={{ opacity: 0, letterSpacing: '0.5em' }}
                        animate={{ opacity: 1, letterSpacing: '0.18em' }}
                        transition={{ duration: 0.4 }}
                        style={{
                            fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 700,
                            color: accent, letterSpacing: '0.18em',
                            textShadow: `0 0 30px rgba(${accentRgb},0.6)`,
                            position: 'relative', overflow: 'hidden',
                        }}
                    >
                        COMMAND CENTER
                        {/* scan line */}
                        <div style={{
                            position: 'absolute', top: 0, left: '-40%', width: '40%', height: '100%',
                            background: `linear-gradient(90deg, transparent, rgba(${accentRgb},0.3), transparent)`,
                            animation: 'ct-scan 0.6s ease-out forwards',
                        }} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Progress bar */}
            <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', width: 200, height: 2, background: 'rgba(255,255,255,0.05)' }}>
                <motion.div
                    animate={{ width: `${(phase / 4) * 100}%` }}
                    transition={{ duration: 0.25 }}
                    style={{ height: '100%', background: `linear-gradient(90deg, transparent, ${accent})`, borderRadius: 1 }}
                />
            </div>
        </motion.div>
    );
}
