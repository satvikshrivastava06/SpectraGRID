import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStoreState, store } from '../../store';

export const STAGES = [
    { id: 1, name: 'Stage 1 - Ghost Generation', desc: 'Ghost Deficit & Loss Attribution', targetId: 'ghost-generation', color: '#00F0FF' },
    { id: 2, name: 'Stage 2 - Twin Dashboard', desc: 'Real-time Asset Control', targetId: 'digital-twin-dashboard', color: '#4DA6FF' },
    { id: 3, name: 'Stage 3 - Infrastructure Simulator', desc: 'Digital Twin Sandbox', targetId: 'scenario-simulator', color: '#FFB800' },
    { id: 4, name: 'Stage 4 - Climate Impact Intelligence', desc: 'dMRV Ledger & Carbon Offsets', targetId: 'esg-intelligence', color: '#00E676' },
    { id: 5, name: 'Stage 5 - Infrastructure Observability', desc: 'SRE Telemetry & Ingestion', targetId: 'observability', color: '#9D00FF' },
    { id: 6, name: 'Stage 6 - Deploy Twin Instance', desc: 'Prescriptive Intelligence', targetId: 'cta', color: '#FF6B00' },
] as const;

export default function TelemetryHUD() {
    const { stage: activeStageIndex } = useStoreState();
    const currentStage = STAGES[activeStageIndex] || STAGES[0];

    const [isMinimized, setIsMinimized] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const timerRef = useRef<number | null>(null);

    // Auto-minimize after 3 seconds of inactivity (when not hovered)
    useEffect(() => {
        if (isMinimized || isHovered) {
            if (timerRef.current) {
                window.clearTimeout(timerRef.current);
                timerRef.current = null;
            }
            return;
        }

        timerRef.current = window.setTimeout(() => {
            setIsMinimized(true);
        }, 3000);

        return () => {
            if (timerRef.current) {
                window.clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [isMinimized, isHovered]);

    const handleToggleMinimize = (e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        setIsMinimized((prev) => !prev);
    };

    const handleStageClick = (targetId: string, idx: number) => {
        store.stage = idx;
        const el = document.getElementById(targetId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <motion.div
            layout
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            initial={false}
            animate={{
                width: isMinimized ? 236 : 316,
                padding: isMinimized ? '10px 14px' : '18px 20px',
                borderRadius: isMinimized ? 12 : 10,
            }}
            transition={{
                type: 'spring',
                stiffness: 380,
                damping: 32,
                mass: 0.8,
            }}
            className="glass-panel mono"
            style={{
                position: 'fixed',
                left: '28px',
                top: '100px',
                zIndex: 90,
                display: 'flex',
                flexDirection: 'column',
                gap: isMinimized ? '0px' : '12px',
                borderLeft: `3px solid ${currentStage.color}`,
                background: 'rgba(12, 14, 18, 0.86)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow: isMinimized
                    ? `0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px ${currentStage.color}25`
                    : `0 12px 38px rgba(0, 0, 0, 0.55), 0 0 24px ${currentStage.color}1a`,
                transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
                cursor: isMinimized ? 'pointer' : 'default',
                userSelect: 'none',
            }}
            onClick={isMinimized ? () => setIsMinimized(false) : undefined}
            title={isMinimized ? 'Click to expand Telemetry HUD' : undefined}
        >
            <AnimatePresence mode="wait" initial={false}>
                {isMinimized ? (
                    /* Minimized View */
                    <motion.div
                        key="minimized-hud"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            gap: '12px',
                        }}
                    >
                        {/* Status Beacon & Label */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                            <div style={{ position: 'relative', width: '10px', height: '10px', flexShrink: 0 }}>
                                <div
                                    className="telemetry-radar-ping"
                                    style={{
                                        backgroundColor: currentStage.color,
                                        opacity: 0.7,
                                    }}
                                />
                                <div
                                    style={{
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        backgroundColor: currentStage.color,
                                        boxShadow: `0 0 10px ${currentStage.color}`,
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span
                                        style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            color: currentStage.color,
                                            letterSpacing: '0.04em',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        STAGE 0{currentStage.id}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: '0.58rem',
                                            padding: '1px 4px',
                                            borderRadius: '2px',
                                            background: `${currentStage.color}20`,
                                            color: currentStage.color,
                                            border: `1px solid ${currentStage.color}40`,
                                            fontWeight: 700,
                                        }}
                                    >
                                        LIVE
                                    </span>
                                </div>
                                <span
                                    style={{
                                        fontSize: '0.62rem',
                                        color: 'rgba(255,255,255,0.45)',
                                        whiteSpace: 'nowrap',
                                        textOverflow: 'ellipsis',
                                        overflow: 'hidden',
                                        maxWidth: '120px',
                                    }}
                                >
                                    Twin Telemetry
                                </span>
                            </div>
                        </div>

                        {/* Fluid Glass Maximize Button */}
                        <motion.button
                            type="button"
                            className="fluid-glass-btn"
                            onClick={handleToggleMinimize}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.92 }}
                            title="Maximize Telemetry HUD"
                            aria-label="Maximize Telemetry HUD"
                            style={{
                                width: '28px',
                                height: '28px',
                                flexShrink: 0,
                                borderColor: `${currentStage.color}40`,
                                boxShadow: `inset 0 1px 1px rgba(255,255,255,0.35), 0 2px 8px rgba(0,0,0,0.4), 0 0 10px ${currentStage.color}25`,
                            }}
                        >
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 16 16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M10 2h4v4" />
                                <path d="M14 2L9 7" />
                                <path d="M6 14H2v-4" />
                                <path d="M2 14l5-5" />
                            </svg>
                        </motion.button>
                    </motion.div>
                ) : (
                    /* Expanded View */
                    <motion.div
                        key="expanded-hud"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            width: '100%',
                        }}
                    >
                        {/* Header Bar */}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingBottom: '6px',
                                borderBottom: '1px solid rgba(255,255,255,0.06)',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div
                                    style={{
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        backgroundColor: currentStage.color,
                                        boxShadow: `0 0 8px ${currentStage.color}`,
                                    }}
                                />
                                <span
                                    style={{
                                        fontSize: '0.72rem',
                                        color: 'rgba(255,255,255,0.6)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1.4px',
                                    }}
                                >
                                    Telemetry Stream
                                </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span
                                    style={{
                                        fontSize: '0.62rem',
                                        padding: '2px 6px',
                                        borderRadius: '3px',
                                        background: `${currentStage.color}22`,
                                        color: currentStage.color,
                                        border: `1px solid ${currentStage.color}44`,
                                        fontWeight: 700,
                                        letterSpacing: '0.04em',
                                    }}
                                >
                                    LIVE
                                </span>

                                {/* Fluid Glass Minimize Button */}
                                <motion.button
                                    type="button"
                                    className="fluid-glass-btn"
                                    onClick={handleToggleMinimize}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.92 }}
                                    title="Minimize HUD"
                                    aria-label="Minimize HUD"
                                    style={{
                                        width: '24px',
                                        height: '24px',
                                        borderColor: `${currentStage.color}40`,
                                        boxShadow: `inset 0 1px 1px rgba(255,255,255,0.35), 0 2px 6px rgba(0,0,0,0.35), 0 0 8px ${currentStage.color}20`,
                                    }}
                                >
                                    <svg
                                        width="11"
                                        height="11"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <line x1="3" y1="8" x2="13" y2="8" />
                                    </svg>
                                </motion.button>
                            </div>
                        </div>

                        {/* Inactivity countdown progress line */}
                        <div
                            style={{
                                height: '2px',
                                width: '100%',
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '2px',
                                overflow: 'hidden',
                                marginTop: '-4px',
                                marginBottom: '2px',
                            }}
                            title={isHovered ? 'Active: countdown paused while hovering' : 'Auto-minimizing after 3s of inactivity'}
                        >
                            <motion.div
                                initial={false}
                                animate={{
                                    width: isHovered ? '100%' : '0%',
                                    opacity: isHovered ? 0.35 : 0.9,
                                }}
                                transition={{
                                    duration: isHovered ? 0.2 : 3,
                                    ease: isHovered ? 'easeOut' : 'linear',
                                }}
                                style={{
                                    height: '100%',
                                    background: `linear-gradient(90deg, ${currentStage.color}, #ffffff)`,
                                    boxShadow: `0 0 6px ${currentStage.color}`,
                                    borderRadius: '2px',
                                }}
                            />
                        </div>

                        {/* Stages list */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {STAGES.map((stageItem, idx) => {
                                const isActive = activeStageIndex === idx;
                                const stageColor = stageItem.color;

                                return (
                                    <div
                                        key={stageItem.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleStageClick(stageItem.targetId, idx);
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            opacity: isActive ? 1 : 0.45,
                                            padding: '6px 8px',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            background: isActive ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
                                            border: isActive ? `1px solid ${stageColor}33` : '1px solid transparent',
                                            transition: 'all 0.25s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isActive) e.currentTarget.style.opacity = '0.85';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isActive) e.currentTarget.style.opacity = '0.45';
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: isActive ? '10px' : '5px',
                                                height: isActive ? '10px' : '5px',
                                                backgroundColor: isActive ? stageColor : '#FFF',
                                                borderRadius: '50%',
                                                boxShadow: isActive ? `0 0 10px ${stageColor}` : 'none',
                                                transition: 'all 0.3s ease',
                                                flexShrink: 0,
                                            }}
                                        />

                                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                                            <span
                                                style={{
                                                    fontSize: '0.81rem',
                                                    fontWeight: isActive ? 700 : 500,
                                                    color: isActive ? stageColor : '#FFF',
                                                    letterSpacing: '0.02em',
                                                    whiteSpace: 'nowrap',
                                                    textOverflow: 'ellipsis',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {stageItem.name}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: '0.67rem',
                                                    color: isActive ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.4)',
                                                    whiteSpace: 'nowrap',
                                                    textOverflow: 'ellipsis',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {stageItem.desc}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Subtle Footer hint */}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingTop: '4px',
                                borderTop: '1px solid rgba(255,255,255,0.04)',
                                fontSize: '0.58rem',
                                color: isHovered ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.3)',
                                letterSpacing: '0.05em',
                            }}
                        >
                            <span>
                                {isHovered ? '● HUD LOCKED (HOVERED)' : '⚡ AUTO-DOCK (3s IDLE)'}
                            </span>
                            <span style={{ color: currentStage.color, opacity: 0.85 }}>
                                {`STAGE ${currentStage.id}/6`}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
