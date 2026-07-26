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

    const handleStageClick = (targetId: string, idx: number) => {
        store.stage = idx;
        const el = document.getElementById(targetId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div
            className="glass-panel mono"
            style={{
                position: 'fixed',
                left: '28px',
                top: '100px',
                padding: '18px 20px',
                borderRadius: '8px',
                zIndex: 90,
                width: '310px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                borderLeft: `3px solid ${currentStage.color}`,
                background: 'rgba(12, 14, 18, 0.82)',
                backdropFilter: 'blur(12px)',
                boxShadow: `0 8px 32px rgba(0, 0, 0, 0.45), 0 0 20px ${currentStage.color}15`,
                transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.72rem',
                    color: 'rgba(255,255,255,0.45)',
                    textTransform: 'uppercase',
                    letterSpacing: '1.8px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
            >
                <span>Telemetry Stream: Twin System</span>
                <span
                    style={{
                        fontSize: '0.65rem',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        background: `${currentStage.color}22`,
                        color: currentStage.color,
                        border: `1px solid ${currentStage.color}44`,
                        fontWeight: 700,
                    }}
                >
                    LIVE
                </span>
            </div>

            {STAGES.map((stageItem, idx) => {
                const isActive = activeStageIndex === idx;
                const stageColor = stageItem.color;

                return (
                    <div
                        key={stageItem.id}
                        onClick={() => handleStageClick(stageItem.targetId, idx)}
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
                            transition: 'all 0.3s ease',
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
                                    fontSize: '0.82rem',
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
                                    fontSize: '0.68rem',
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
    );
}
