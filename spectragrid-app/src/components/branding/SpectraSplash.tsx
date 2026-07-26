/**
 * SpectraSplash — Cinematic boot sequence on first visit.
 *
 * Sequence: logo draws → energy pulse → particles converge → glow settles → fade out.
 * Duration ~1.5s animation + 0.4s exit. Respects prefers-reduced-motion.
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import SpectraLogo from './SpectraLogo';

const SPLASH_KEY = 'spectragrid-splash-seen';
const ANIM_MS = 1500;
const FADE_MS = 400;

export interface SpectraSplashProps {
  onComplete: () => void;
}

export default function SpectraSplash({ onComplete }: SpectraSplashProps) {
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<'animating' | 'exiting' | 'done'>('animating');

  const dismiss = () => {
    if (phase !== 'animating') return;
    setPhase('exiting');
  };

  useEffect(() => {
    if (reducedMotion) {
      sessionStorage.setItem(SPLASH_KEY, '1');
      onComplete();
      setVisible(false);
      return;
    }

    const exitTimer = window.setTimeout(() => setPhase('exiting'), ANIM_MS);
    return () => window.clearTimeout(exitTimer);
  }, [reducedMotion, onComplete]);

  useEffect(() => {
    if (phase !== 'exiting') return;
    const doneTimer = window.setTimeout(() => {
      sessionStorage.setItem(SPLASH_KEY, '1');
      setVisible(false);
      setPhase('done');
      onComplete();
    }, FADE_MS);
    return () => window.clearTimeout(doneTimer);
  }, [phase, onComplete]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          className="spectra-splash"
          role="dialog"
          aria-label="SpectraGRID loading"
          initial={{ opacity: 1 }}
          animate={{ opacity: phase === 'exiting' ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: FADE_MS / 1000, ease: [0.4, 0, 0.2, 1] }}
          onClick={dismiss}
          onKeyDown={(e) => e.key === 'Escape' && dismiss()}
          tabIndex={-1}
        >
          <div className="spectra-splash__vignette" aria-hidden />
          <div className="spectra-splash__grid" aria-hidden />

          <motion.div
            className="spectra-splash__content"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <SpectraLogo
              variant="splash"
              accent="var(--brand-accent)"
              animate={!reducedMotion}
              showWordmark={false}
            />

            <motion.p
              className="spectra-splash__wordmark"
              initial={{ opacity: 0, letterSpacing: '0.4em' }}
              animate={{ opacity: 1, letterSpacing: '0.22em' }}
              transition={{ delay: 0.65, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <span style={{ fontWeight: 400, marginRight: '0.22em' }}>Spectra</span>
              <span className="spectra-splash__accent" style={{ fontWeight: 800 }}>
                GRID
              </span>
            </motion.p>

            <motion.div
              className="spectra-splash__progress"
              aria-hidden
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: ANIM_MS / 1000, ease: [0.4, 0, 0.2, 1] }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Returns true if splash should play this session */
export function shouldPlaySplash(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  return sessionStorage.getItem(SPLASH_KEY) !== '1';
}
