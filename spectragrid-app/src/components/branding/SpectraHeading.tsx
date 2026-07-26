/**
 * SpectraHeading — Signature hero brand lockup.
 *
 * Renders SpectraGRID as a cinematic typographic centerpiece with:
 * - Layered depth (shadow + highlight scan)
 * - Staggered tagline word reveal
 * - Lightweight particle/grid background (CSS + canvas, GPU-friendly)
 */
import { useEffect, useRef, useCallback } from 'react';
import { motion, useReducedMotion, useMotionValue, useTransform } from 'framer-motion';
import SpectraLogo from './SpectraLogo';

const TAGLINE_WORDS = [
  'Autonomous',
  'Renewable',
  'Asset',
  'Intelligence',
] as const;

export interface SpectraHeadingProps {
  /** Play logo splash on mount */
  animate?: boolean;
  accent?: string;
  className?: string;
}

export default function SpectraHeading({
  animate = true,
  accent = 'var(--brand-accent, #00F0FF)',
  className = '',
}: SpectraHeadingProps) {
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const parallaxX = useTransform(mouseX, [0, 1], [-12, 12]);
  const parallaxY = useTransform(mouseY, [0, 1], [-8, 8]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (reducedMotion || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseX.set((e.clientX - rect.left) / rect.width);
      mouseY.set((e.clientY - rect.top) / rect.height);
    },
    [mouseX, mouseY, reducedMotion],
  );

  /* ─── Lightweight particle field — capped count, paused off-screen ─── */
  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let visible = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    type Particle = { x: number; y: number; vx: number; vy: number; size: number; alpha: number };
    let particles: Particle[] = [];

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = width < 640 ? 28 : 48;
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.12,
        size: Math.random() * 1.2 + 0.4,
        alpha: Math.random() * 0.35 + 0.08,
      }));
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) raf = requestAnimationFrame(tick);
      },
      { threshold: 0.05 },
    );
    observer.observe(container);

    const tick = () => {
      if (!visible) return;
      const { width, height } = container.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 240, 255, ${p.alpha})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      observer.disconnect();
    };
  }, [reducedMotion]);

  const shouldAnimate = animate && !reducedMotion;

  return (
    <div
      ref={containerRef}
      className={`spectra-heading ${className}`.trim()}
      onMouseMove={handleMouseMove}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        width: '100%',
        maxWidth: '960px',
        margin: '0 auto',
        padding: '0 24px',
      }}
    >
      {/* Cinematic backdrop layers — low opacity, typography stays dominant */}
      <div className="spectra-heading__backdrop" aria-hidden>
        <canvas ref={canvasRef} className="spectra-heading__particles" />
        <motion.div
          className="spectra-heading__grid"
          style={{ x: parallaxX, y: parallaxY }}
        />
        <div className="spectra-heading__volumetric" />
        <motion.div
          className="spectra-heading__energy-lines"
          animate={
            shouldAnimate
              ? { backgroundPosition: ['0% 0%', '100% 100%'] }
              : undefined
          }
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Logo mark above wordmark — establishes visual hierarchy */}
      <motion.div
        initial={shouldAnimate ? { opacity: 0, y: 12 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        style={{ marginBottom: 'clamp(20px, 4vw, 32px)', position: 'relative', zIndex: 2 }}
      >
        <SpectraLogo
          variant="hero"
          accent={accent}
          animate={shouldAnimate}
          showWordmark={false}
        />
      </motion.div>

      {/* Signature title — layered for depth + scan highlight */}
      <div className="spectra-heading__title-wrap" style={{ position: 'relative', zIndex: 2 }}>
        {/* Depth shadow layer */}
        <span className="spectra-heading__title spectra-heading__title--depth" aria-hidden>
          <span className="spectra-heading__spectra">Spectra</span>
          <span className="spectra-heading__accent">GRID</span>
        </span>

        {/* Primary title */}
        <motion.h1
          className="spectra-heading__title"
          initial={shouldAnimate ? { opacity: 0, y: 24 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.span
            className="spectra-heading__spectra"
            whileHover={reducedMotion ? undefined : { filter: 'brightness(1.12)' }}
          >
            Spectra
          </motion.span>
          <motion.span
            className="spectra-heading__accent"
            whileHover={reducedMotion ? undefined : { filter: 'brightness(1.2)' }}
          >
            GRID
          </motion.span>

          {/* Animated energy scan — travels across letterforms */}
          {shouldAnimate && (
            <motion.span
              className="spectra-heading__scan"
              aria-hidden
              initial={{ x: '-120%' }}
              animate={{ x: '220%' }}
              transition={{
                duration: 2.4,
                delay: 1.1,
                ease: [0.4, 0, 0.2, 1],
                repeat: Infinity,
                repeatDelay: 4.5,
              }}
            />
          )}
        </motion.h1>
      </div>

      {/* Tagline — each word fades upward with stagger */}
      <p
        className="spectra-heading__tagline"
        style={{ position: 'relative', zIndex: 2 }}
        aria-label="Autonomous Renewable Asset Intelligence"
      >
        {TAGLINE_WORDS.map((word, i) => (
          <motion.span
            key={word}
            className="spectra-heading__tagline-word"
            initial={shouldAnimate ? { opacity: 0, y: 14 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.55,
              delay: 0.85 + i * 0.1,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {word}
          </motion.span>
        ))}
      </p>
    </div>
  );
}
