import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { useStoreState, subscribe, store, scrollRef } from '../store';
import SpectraLogo from './branding/SpectraLogo';
import { LoginGate } from './auth/LoginGate';

const NAV_LINKS = [
  { label: 'Digital Twin', href: '#cta' },
  { label: 'Ghost Gen', href: '#ghost-generation' },
  { label: 'Energy Flow', href: '#energy-flow' },
  { label: 'Recommendations', href: '#ai-console' },
  { label: 'Telemetry', href: '#predictive' },
] as const;

export type EnvMode = 'day' | 'sunset' | 'storm' | 'night' | 'recovery' | 'orange';

export function getEnvMode(stage: number, progress: number): EnvMode {
  if (stage === 5 || progress > 0.88) return 'orange';
  if (stage === 4) return 'storm';
  if (stage === 3) return 'recovery';
  if (stage === 2) return 'sunset';
  if (stage === 1) return 'night';
  return 'day';
}

export const ENV_PALETTE: Record<
  EnvMode,
  { accent: string; accentRgb: string; glow: string; edge: string; glass: string }
> = {
  day: {
    accent: '#00F0FF',
    accentRgb: '0, 240, 255',
    glow: 'rgba(0, 240, 255, 0.45)',
    edge: 'rgba(0, 240, 255, 0.55)',
    glass: 'rgba(8, 18, 28, 0.42)',
  },
  sunset: {
    accent: '#FFB800',
    accentRgb: '255, 184, 0',
    glow: 'rgba(255, 140, 40, 0.5)',
    edge: 'rgba(255, 184, 0, 0.6)',
    glass: 'rgba(28, 14, 8, 0.48)',
  },
  storm: {
    accent: '#9D00FF',
    accentRgb: '157, 0, 255',
    glow: 'rgba(255, 0, 60, 0.4)',
    edge: 'rgba(255, 0, 60, 0.65)',
    glass: 'rgba(18, 6, 24, 0.55)',
  },
  night: {
    accent: '#4DA6FF',
    accentRgb: '77, 166, 255',
    glow: 'rgba(77, 166, 255, 0.35)',
    edge: 'rgba(77, 166, 255, 0.5)',
    glass: 'rgba(10, 12, 16, 0.62)',
  },
  recovery: {
    accent: '#00E676',
    accentRgb: '0, 230, 118',
    glow: 'rgba(0, 230, 118, 0.4)',
    edge: 'rgba(0, 230, 118, 0.55)',
    glass: 'rgba(6, 22, 16, 0.48)',
  },
  orange: {
    accent: '#FF6B00',
    accentRgb: '255, 107, 0',
    glow: 'rgba(255, 107, 0, 0.55)',
    edge: 'rgba(255, 107, 0, 0.7)',
    glass: 'rgba(28, 12, 6, 0.5)',
  },
};

type Trail = { id: number; x: number; y: number; vx: number; vy: number; life: number };
type ImpactBurst = { id: number; x: number; y: number; life: number };

/* ─── Photon swarm label ─── */

function SwarmLabel({
  text,
  active,
  accent,
  formed,
  selected,
}: {
  text: string;
  active: boolean;
  accent: string;
  formed: boolean;
  selected: boolean;
}) {
  const chars = text.toUpperCase().split('');
  const lit = active || selected;

  return (
    <span
      style={{
        display: 'inline-flex',
        position: 'relative',
        letterSpacing: '0.12em',
        fontSize: '0.78rem',
        fontWeight: selected ? 600 : 500,
      }}
    >
      {chars.map((ch, i) => {
        const scatterX = ((i * 37) % 11) - 5;
        const scatterY = ((i * 53) % 9) - 4;
        return (
          <motion.span
            key={`${ch}-${i}`}
            animate={
              formed
                ? { x: 0, y: 0, opacity: 1, filter: 'blur(0px)' }
                : active
                  ? { x: scatterX * 1.2, y: scatterY * 1.4, opacity: 0.35, filter: 'blur(2px)' }
                  : { x: 0, y: 0, opacity: 0.85, filter: 'blur(0px)' }
            }
            transition={{ type: 'spring', stiffness: 280, damping: 22, delay: formed ? i * 0.018 : 0 }}
            style={{
              display: 'inline-block',
              color: selected ? '#fff' : lit ? accent : 'rgba(255,255,255,0.88)',
              textShadow: lit
                ? selected
                  ? `0 0 10px #fff, 0 0 22px ${accent}, 0 0 40px ${accent}`
                  : `0 0 12px ${accent}, 0 0 24px ${accent}55`
                : 'none',
              whiteSpace: 'pre',
            }}
          >
            {ch === ' ' ? '\u00A0' : ch}
          </motion.span>
        );
      })}

      <AnimatePresence>
        {active &&
          [1, 2].map((echo) => (
            <motion.span
              key={echo}
              initial={{ opacity: 0, x: 0 }}
              animate={{ opacity: 0.18 / echo, x: echo * 3, y: -echo * 2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              aria-hidden
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                color: accent,
                pointerEvents: 'none',
                letterSpacing: '0.12em',
                whiteSpace: 'nowrap',
                filter: `blur(${echo}px)`,
              }}
            >
              {text.toUpperCase()}
            </motion.span>
          ))}
      </AnimatePresence>
    </span>
  );
}


/* ─── Main Navbar ─── */

export default function Navbar({ onCommandCenter }: { onCommandCenter?: () => void }) {
  const { stage } = useStoreState();
  const envMode = getEnvMode(stage, scrollRef.value);
  const palette = ENV_PALETTE[envMode];

  const navRef = useRef<HTMLElement>(null);
  const linksRowRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [swarmFormed, setSwarmFormed] = useState<Record<number, boolean>>({});
  const [trails, setTrails] = useState<Trail[]>([]);
  const [impacts, setImpacts] = useState<ImpactBurst[]>([]);
  const [cursorPx, setCursorPx] = useState({ x: 0, y: 0 });
  const [underline, setUnderline] = useState({ left: 0, width: 48 });
  const [selectSurge, setSelectSurge] = useState(0);
  const [edgeFlash, setEdgeFlash] = useState(false);
  const [selectPunch, setSelectPunch] = useState<number | null>(null);
  const trailId = useRef(0);
  const impactId = useRef(0);
  const lastMouse = useRef({ x: 0, y: 0, t: 0 });
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const springX = useSpring(mx, { stiffness: 120, damping: 22 });
  const springY = useSpring(my, { stiffness: 120, damping: 22 });

  const syncUnderline = useCallback(() => {
    const el = itemRefs.current[activeIndex];
    const row = linksRowRef.current;
    if (!el || !row) return;
    const er = el.getBoundingClientRect();
    const rr = row.getBoundingClientRect();
    setUnderline({
      left: er.left - rr.left + er.width / 2,
      width: Math.max(er.width * 0.72, 48),
    });
  }, [activeIndex]);

  useLayoutEffect(() => {
    syncUnderline();
    const raf = requestAnimationFrame(syncUnderline);
    window.addEventListener('resize', syncUnderline);
    const row = linksRowRef.current;
    const observer = row ? new ResizeObserver(syncUnderline) : null;
    if (row && observer) observer.observe(row);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', syncUnderline);
      observer?.disconnect();
    };
  }, [syncUnderline]);

  useLayoutEffect(() => {
    syncUnderline();
  }, [hoverIndex, syncUnderline]);

  // Keep active tab in sync with visible page section (Lenis-driven scroll)
  useEffect(() => {
    let raf = 0;
    let lastScroll = -1;

    const resolveActive = () => {
      // If store.stage is 5 (Stage 6 - Deploy Twin Instance), Digital Twin link (index 0, #cta) is active
      if (store.stage === 5) {
        setActiveIndex(0);
        return;
      }

      const navLine = 96;
      let best = 0;
      for (let idx = NAV_LINKS.length - 1; idx >= 0; idx--) {
        const el = document.getElementById(NAV_LINKS[idx].href.slice(1));
        if (!el) continue;
        if (el.getBoundingClientRect().top <= navLine) {
          best = idx;
          break;
        }
      }
      setActiveIndex(best);
    };

    const scheduleResolve = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(resolveActive);
    };

    resolveActive();
    window.addEventListener('resize', scheduleResolve);

    const unsub = subscribe(() => {
      if (scrollRef.value === lastScroll) return;
      lastScroll = scrollRef.value;
      scheduleResolve();
    });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', scheduleResolve);
      unsub();
    };
  }, []);

  // Fade impact bursts
  useEffect(() => {
    if (!impacts.length) return;
    const id = requestAnimationFrame(() => {
      setImpacts((prev) =>
        prev
          .map((b) => ({ ...b, life: b.life - 0.04 }))
          .filter((b) => b.life > 0)
      );
    });
    return () => cancelAnimationFrame(id);
  }, [impacts]);

  // Trail fade
  useEffect(() => {
    if (!trails.length) return;
    const id = requestAnimationFrame(() => {
      setTrails((prev) =>
        prev
          .map((tr) => ({ ...tr, life: tr.life - 0.045, x: tr.x + tr.vx, y: tr.y + tr.vy }))
          .filter((tr) => tr.life > 0)
      );
    });
    return () => cancelAnimationFrame(id);
  }, [trails]);

  const onNavMove = useCallback(
    (e: ReactMouseEvent) => {
      if (!navRef.current) return;
      const rect = navRef.current.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;
      mx.set(localX);
      my.set(localY);
      const nowPx = performance.now();
      if (nowPx - lastMouse.current.t > 32) {
        setCursorPx({ x: localX, y: localY });
      }

      const now = performance.now();
      const dt = Math.max(1, now - lastMouse.current.t);
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      const speed = Math.hypot(dx, dy) / dt;

      if (speed > 0.55) {
        const id = ++trailId.current;
        setTrails((prev) => [
          ...prev.slice(-18),
          {
            id,
            x: localX,
            y: localY,
            vx: dx * 0.08,
            vy: dy * 0.08,
            life: 1,
          },
        ]);
      }
      lastMouse.current = { x: e.clientX, y: e.clientY, t: now };
    },
    [mx, my]
  );

  const triggerSelectFeedback = useCallback((toX: number, index: number) => {
    setSelectSurge(1);
    setEdgeFlash(true);
    setSelectPunch(index);
    setImpacts((prev) => [...prev, { id: ++impactId.current, x: toX, y: 36, life: 1 }]);
    const start = performance.now();
    const tick = (n: number) => {
      const v = Math.max(0, 1 - (n - start) / 700);
      setSelectSurge(v);
      if (v > 0) requestAnimationFrame(tick);
      else {
        setEdgeFlash(false);
        setSelectPunch(null);
      }
    };
    requestAnimationFrame(tick);
  }, []);

  const handleNavClick = (_e: ReactMouseEvent, index: number) => {
    const el = itemRefs.current[index];
    let impactX = underline.left;
    if (el && navRef.current) {
      const er = el.getBoundingClientRect();
      const nr = navRef.current.getBoundingClientRect();
      impactX = er.left + er.width / 2 - nr.left;
    }
    setActiveIndex(index);
    requestAnimationFrame(syncUnderline);
    triggerSelectFeedback(impactX, index);
  };

  const handleHover = (index: number | null) => {
    setHoverIndex(index);
    if (index !== null) {
      setSwarmFormed((s) => ({ ...s, [index]: false }));
      requestAnimationFrame(() => {
        setSwarmFormed((s) => ({ ...s, [index]: true }));
      });
    }
  };

  const edgeState = edgeFlash
    ? 'active'
    : envMode === 'storm'
      ? 'critical'
      : envMode === 'sunset'
        ? 'warning'
        : hoverIndex !== null
          ? 'hover'
          : 'active';

  const edgeGlow =
    edgeState === 'critical'
      ? 'rgba(255, 0, 60, 0.85)'
      : edgeState === 'warning'
        ? 'rgba(255, 184, 0, 0.75)'
        : edgeState === 'active' || edgeFlash
          ? 'rgba(255, 255, 255, 0.85)'
          : edgeState === 'hover'
            ? `rgba(${palette.accentRgb}, 0.85)`
            : `rgba(${palette.accentRgb}, 0.4)`;

  return (
    <motion.nav
      ref={navRef}
      onMouseMove={onNavMove}
      onMouseLeave={() => setHoverIndex(null)}
      className="cinematic-nav mono"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '72px',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 36px',
        isolation: 'isolate',
        ['--nav-accent' as string]: palette.accent,
        ['--nav-glow' as string]: palette.glow,
        ['--nav-edge' as string]: edgeGlow,
        ['--nav-glass' as string]: palette.glass,
      }}
    >
      <div className="cinematic-nav__shadow" aria-hidden />

      <div className={`cinematic-nav__fresnel${edgeFlash ? ' is-flash' : ''}`} aria-hidden />
      <div className="cinematic-nav__chroma" aria-hidden />

      {/* Circuit rail — energy travels along this */}
      <div className="cinematic-nav__rail" aria-hidden>
        <div
          className="cinematic-nav__rail-glow"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(${palette.accentRgb},0.25), transparent)`,
          }}
        />
      </div>

      <motion.div
        className="cinematic-nav__reflection"
        aria-hidden
        style={{
          left: springX,
          top: springY,
          background: `radial-gradient(circle, rgba(${palette.accentRgb},0.22) 0%, transparent 65%)`,
        }}
      />

      {trails.map((tr) => (
        <div
          key={tr.id}
          className="cinematic-nav__trail"
          style={{
            left: tr.x,
            top: tr.y,
            opacity: tr.life,
            background: `radial-gradient(circle, rgba(${palette.accentRgb},${0.9 * tr.life}) 0%, transparent 70%)`,
            boxShadow: `0 0 ${8 * tr.life}px rgba(${palette.accentRgb},0.6)`,
          }}
        />
      ))}

      {/* Impact bursts */}
      {impacts.map((b) => (
        <div key={b.id} className="cinematic-nav__impact" style={{ left: b.x, top: b.y, opacity: b.life }}>
          <span
            style={{
              borderColor: palette.accent,
              boxShadow: `0 0 ${40 * b.life}px ${palette.accent}`,
              transform: `scale(${2.2 - b.life})`,
              opacity: b.life,
            }}
          />
          <span
            className="cinematic-nav__impact-core"
            style={{
              background: `radial-gradient(circle, #fff 0%, ${palette.accent} 40%, transparent 70%)`,
              opacity: b.life,
              transform: `scale(${1.5 - b.life * 0.5})`,
            }}
          />
        </div>
      ))}

      <motion.div
        className="cinematic-nav__content"
        animate={{
          x: cursorPx.x * 0.008 - 2,
          y: cursorPx.y * 0.01 - 1,
        }}
        transition={{ type: 'spring', stiffness: 80, damping: 20 }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          <a href="#hero" style={{ textDecoration: 'none', color: 'inherit' }}>
            <SpectraLogo
              variant="navbar"
              accent={palette.accent}
              animate={false}
              showWordmark
            />
          </a>
        </div>

        <div
          ref={linksRowRef}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            position: 'relative',
            zIndex: 2,
          }}
        >
          <motion.div
            className="cinematic-nav__liquid-track"
            animate={{
              left: underline.left,
              width: underline.width,
              opacity: 1,
            }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            style={{
              marginLeft: -underline.width / 2,
              background: `linear-gradient(90deg, transparent, ${palette.accent}, #fff, ${palette.accent}, transparent)`,
              boxShadow: `0 0 ${14 + selectSurge * 20}px ${palette.accent}, 0 0 ${28 + selectSurge * 30}px rgba(${palette.accentRgb},0.5)`,
              height: 2 + selectSurge * 2,
            }}
          />

          {NAV_LINKS.map((link, index) => {
            const isHover = hoverIndex === index;
            const isActive = activeIndex === index;
            const formed = swarmFormed[index] ?? true;
            const punched = selectPunch === index;

            let push = 0;
            if (hoverIndex !== null && hoverIndex !== index) {
              const dist = index - hoverIndex;
              push = Math.sign(dist) * Math.max(0, 14 - Math.abs(dist) * 6);
            }

            let gravityX = 0;
            let gravityY = 0;
            const el = itemRefs.current[index];
            if (el && navRef.current) {
              const ir = el.getBoundingClientRect();
              const nr = navRef.current.getBoundingClientRect();
              const cx = ir.left + ir.width / 2 - nr.left;
              const cy = ir.top + ir.height / 2 - nr.top;
              const dx = cursorPx.x - cx;
              const dy = cursorPx.y - cy;
              const d = Math.hypot(dx, dy);
              if (d < 120 && d > 0) {
                const pull = (1 - d / 120) * 6;
                gravityX = (dx / d) * pull;
                gravityY = (dy / d) * pull;
              }
            }

            return (
              <motion.a
                key={link.href}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                href={link.href}
                onClick={(e) => handleNavClick(e, index)}
                onMouseEnter={() => handleHover(index)}
                onMouseLeave={() => handleHover(null)}
                animate={{
                  x: push + gravityX,
                  y: gravityY,
                  scale: punched ? 1.12 : isHover ? 1.06 : isActive ? 1.03 : 1,
                }}
                transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                style={{
                  position: 'relative',
                  padding: '10px 14px',
                  textDecoration: 'none',
                  color: '#fff',
                  textTransform: 'uppercase',
                }}
              >
                <AnimatePresence>
                  {isHover && (
                    <motion.span
                      className="cinematic-nav__field"
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.15 }}
                      style={{
                        borderColor: `rgba(${palette.accentRgb}, 0.45)`,
                        boxShadow: `0 0 20px rgba(${palette.accentRgb}, 0.25), inset 0 0 16px rgba(${palette.accentRgb}, 0.08)`,
                      }}
                    />
                  )}
                </AnimatePresence>

                {/* Active containment field */}
                {isActive && (
                  <span
                    className="cinematic-nav__active-ring"
                    style={{
                      borderColor: `rgba(${palette.accentRgb}, ${0.35 + selectSurge * 0.4})`,
                      boxShadow: `0 0 ${16 + selectSurge * 24}px rgba(${palette.accentRgb}, ${0.2 + selectSurge * 0.35})`,
                    }}
                  />
                )}

                <SwarmLabel
                  text={link.label}
                  active={isHover}
                  accent={palette.accent}
                  formed={isHover ? formed : true}
                  selected={isActive}
                />
              </motion.a>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative', zIndex: 2 }}>
          <LoginGate accent={palette.accent} accentRgb={palette.accentRgb} />
          <motion.button
            className="btn-primary mono cinematic-nav__cta"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCommandCenter}
            style={{
              fontSize: '0.8rem',
              padding: '8px 16px',
              position: 'relative',
              zIndex: 2,
              background: palette.accent,
              boxShadow: `0 0 22px ${palette.glow}`,
            }}
          >
            COMMAND CENTER
          </motion.button>
        </div>
      </motion.div>
    </motion.nav>
  );
}
