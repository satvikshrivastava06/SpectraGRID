import { Html } from '@react-three/drei';

type AIRecommendationProps = {
    id: string;
    action: string;
    financialRecovery: string;
    carbonRecovery: string;
    confidence: number;
    position: [number, number, number];
};

export default function AIRecommendation({ id, action, financialRecovery, carbonRecovery, confidence, position }: AIRecommendationProps) {
    return (
        <Html position={position} center zIndexRange={[100, 0]}>
            <div className="glass-panel mono" style={{
                width: '280px',
                padding: '16px',
                borderLeft: '4px solid var(--color-violet)',
                color: '#111',
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(20px)',
                borderRadius: '4px',
                boxShadow: '0 10px 40px rgba(157, 0, 255, 0.4)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-violet)', textTransform: 'uppercase' }}>AI REC #{id}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#333' }}>{confidence}% CONF</span>
                </div>

                <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '16px', color: '#111' }}>
                    {action}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ color: '#555' }}>Financial Rec:</span>
                        <span style={{ color: 'var(--color-emerald)', fontWeight: 700 }}>{financialRecovery}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ color: '#555' }}>Carbon Rec:</span>
                        <span style={{ color: 'var(--color-emerald)', fontWeight: 700 }}>{carbonRecovery}</span>
                    </div>
                </div>
            </div>
        </Html>
    );
}
