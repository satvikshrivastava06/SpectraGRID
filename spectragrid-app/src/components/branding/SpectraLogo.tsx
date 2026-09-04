import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import logoPng from '../../assets/spectragrid-logo.png';

export type SpectraLogoVariant = 'navbar' | 'hero' | 'icon' | 'splash';

export interface SpectraLogoProps {
  variant?: SpectraLogoVariant;
  /** Explicit override size in pixels */
  size?: number;
  /** Accent for nodes + GRID wordmark — defaults to brand cyan */
  accent?: string;
  /** Play full splash sequence (draw → pulse → converge → settle) */
  animate?: boolean;
  /** Show SpectraGRID wordmark beside mark */
  showWordmark?: boolean;
  className?: string;
}

const VARIANT_SIZE: Record<SpectraLogoVariant, number> = {
  icon: 44,
  navbar: 52,
  hero: 150,
  splash: 128,
};

const WORDMARK_SIZE: Record<SpectraLogoVariant, string> = {
  icon: '0',
  navbar: '1.3rem',
  hero: '1.5rem',
  splash: '0',
};

export default function SpectraLogo({
  variant = 'navbar',
  size: customSize,
  accent = 'var(--brand-accent, #00F0FF)',
  animate = false,
  showWordmark = true,
  className = '',
}: SpectraLogoProps) {
  const reducedMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [splashDone, setSplashDone] = useState(!animate || reducedMotion);

  const size = customSize ?? VARIANT_SIZE[variant];

  const shouldAnimate = animate && !reducedMotion;
  const playSplash = shouldAnimate && !splashDone;

  return (
    <motion.div
      className={`spectra-logo ${className}`.trim()}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: variant === 'icon' ? 0 : 11,
        cursor: variant === 'navbar' ? 'pointer' : 'default',
        position: 'relative',
      }}
      whileHover={
        reducedMotion
          ? undefined
          : {
            rotate: hovered ? 4 : 0,
            transition: { type: 'spring', stiffness: 380, damping: 22 },
          }
      }
    >
      {/* Outward energy pulse on hover — GPU transform + opacity only */}
      {!reducedMotion && hovered && (
        <motion.span
          aria-hidden
          className="spectra-logo__pulse-ring"
          initial={{ scale: 0.6, opacity: 0.55 }}
          animate={{ scale: 2.2, opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            left: size / 2,
            top: '50%',
            width: size,
            height: size,
            marginLeft: -size / 2,
            marginTop: -size / 2,
            borderRadius: '50%',
            border: `1px solid ${accent}`,
            pointerEvents: 'none',
          }}
        />
      )}

      <motion.div
        style={{
          position: 'relative',
          width: size,
          height: size,
          flexShrink: 0,
        }}
        animate={
          playSplash
            ? {
              filter: [
                `drop-shadow(0 0 0px ${accent})`,
                `drop-shadow(0 0 14px ${accent})`,
                `drop-shadow(0 0 6px ${accent})`,
              ],
            }
            : hovered && !reducedMotion
              ? { filter: `drop-shadow(0 0 10px ${accent})` }
              : { filter: `drop-shadow(0 0 4px ${accent})` }
        }
        transition={
          playSplash
            ? { duration: 1.5, times: [0, 0.65, 1], onComplete: () => setSplashDone(true) }
            : { duration: 0.35 }
        }
      >
        <img
          src={logoPng}
          alt="SpectraGRID Logo"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </motion.div>

      {showWordmark && variant !== 'icon' && (
        <Wordmark
          accent={accent}
          fontSize={WORDMARK_SIZE[variant]}
          brighten={hovered && !reducedMotion}
          animate={shouldAnimate}
        />
      )}
    </motion.div>
  );
}

/* ─── Premium wordmark — wide-tracked Geist display ─── */
function Wordmark({
  accent,
  fontSize,
  brighten,
  animate,
}: {
  accent: string;
  fontSize: string;
  brighten: boolean;
  animate: boolean;
}) {
  return (
    <motion.span
      className="spectra-logo__wordmark"
      initial={animate ? { opacity: 0, x: -6 } : false}
      animate={{
        opacity: 1,
        x: 0,
        filter: brighten ? 'brightness(1.15)' : 'brightness(1)',
      }}
      transition={{ delay: animate ? 0.75 : 0, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        fontFamily: 'var(--font-brand, var(--font-sans))',
        fontSize,
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ color: 'var(--brand-text, oklch(0.98 0.005 260))', fontWeight: 400, letterSpacing: '0.04em', marginRight: '0.22em' }}>
        Spectra
      </span>
      <span
        style={{
          color: 'var(--brand-accent, ' + accent + ')',
          fontWeight: 800,
          letterSpacing: '0.22em',
          textShadow: '0 0 20px var(--brand-glow, rgba(0, 240, 255, 0.35))',
        }}
      >
        GRID
      </span>
    </motion.span>
  );
}

/** Standalone logo export */
export function SpectraLogoMark() {
  return (
    <img
      src={logoPng}
      alt="SpectraGRID"
      style={{
        width: 32,
        height: 32,
        objectFit: 'contain',
        display: 'block',
      }}
    />
  );
}



