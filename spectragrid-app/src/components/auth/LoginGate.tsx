import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loginUser, logoutUser } from '../../apiClient';

interface LoginGateProps {
    onLoginSuccess?: (user: any) => void;
    accent?: string;
    accentRgb?: string;
}

export const LoginGate: React.FC<LoginGateProps> = ({
    onLoginSuccess,
    accent = '#00F0FF',
    accentRgb = '0, 240, 255',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [username, setUsername] = useState('ops@spectragrid.ai');
    const [password, setPassword] = useState('password123');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(() => {
        const saved = localStorage.getItem('spectragrid_user');
        return saved ? JSON.parse(saved) : null;
    });

    const presetUsers = [
        { label: 'Operator', email: 'ops@spectragrid.ai', role: 'Operator' },
        { label: 'Admin', email: 'admin@spectragrid.ai', role: 'Administrator' },
        { label: 'Manager', email: 'exec@spectragrid.ai', role: 'Manager' },
        { label: 'ESG Auditor', email: 'auditor@esg.org', role: 'Auditor' },
    ];

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        setErrorMsg(null);
        const res = await loginUser(username, password);
        setLoading(false);
        if (res.ok && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('spectragrid_user', JSON.stringify(res.data.user));
            setIsOpen(false);
            if (onLoginSuccess) onLoginSuccess(res.data.user);
        } else {
            setErrorMsg(res.data.error || 'Authentication failed.');
        }
    };

    const handleLogout = async () => {
        await logoutUser();
        setUser(null);
        localStorage.removeItem('spectragrid_user');
    };

    const selectPreset = (preset: (typeof presetUsers)[0]) => {
        setUsername(preset.email);
        setPassword('password123');
    };

    return (
        <>
            {/* Inline nav button */}
            {user ? (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: `rgba(${accentRgb}, 0.08)`,
                        border: `1px solid rgba(${accentRgb}, 0.28)`,
                        borderRadius: '4px',
                        padding: '6px 12px',
                        fontSize: '0.72rem',
                        fontFamily: 'var(--font-mono)',
                        color: accent,
                        cursor: 'default',
                        position: 'relative',
                        zIndex: 2,
                    }}
                >
                    <span
                        style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: '#00E676',
                            boxShadow: '0 0 8px #00E676',
                            flexShrink: 0,
                            animation: 'pulse-glow-green 2s infinite',
                        }}
                    />
                    <span style={{ color: '#fff', fontWeight: 600 }}>{user.username}</span>
                    <span
                        style={{
                            background: `rgba(${accentRgb}, 0.15)`,
                            color: accent,
                            padding: '1px 5px',
                            borderRadius: '2px',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                        }}
                    >
                        {user.role}
                    </span>
                    <button
                        onClick={handleLogout}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255,255,255,0.4)',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                            fontFamily: 'var(--font-mono)',
                            padding: '0 0 0 4px',
                            marginLeft: '2px',
                            transition: 'color 0.2s',
                        }}
                        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--color-red)')}
                        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)')}
                    >
                        ✕
                    </button>
                </div>
            ) : (
                <motion.button
                    onClick={() => setIsOpen(true)}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.14)',
                        borderRadius: '4px',
                        padding: '7px 14px',
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        color: 'rgba(255,255,255,0.75)',
                        letterSpacing: '0.08em',
                        cursor: 'pointer',
                        position: 'relative',
                        zIndex: 2,
                        transition: 'border-color 0.2s, color 0.2s',
                    }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = `rgba(${accentRgb},0.5)`;
                        (e.currentTarget as HTMLElement).style.color = accent;
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.14)';
                        (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.75)';
                    }}
                >
                    <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="12" cy="8" r="4" />
                        <path d="M20 21a8 8 0 1 0-16 0" />
                    </svg>
                    LOGIN
                </motion.button>
            )}

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="login-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 9000,
                            background: 'rgba(6, 8, 14, 0.88)',
                            backdropFilter: 'blur(12px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '16px',
                        }}
                        onClick={e => { if (e.target === e.currentTarget) setIsOpen(false); }}
                    >
                        <motion.div
                            key="login-panel"
                            initial={{ opacity: 0, scale: 0.94, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.94, y: 20 }}
                            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
                            style={{
                                background: 'rgba(12,13,20,0.98)',
                                border: `1px solid rgba(${accentRgb}, 0.28)`,
                                borderRadius: '10px',
                                width: '100%',
                                maxWidth: '420px',
                                padding: '32px',
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: `0 24px 80px rgba(0,0,0,0.8), 0 0 60px rgba(${accentRgb}, 0.08)`,
                            }}
                        >
                            {/* Corner glow */}
                            <div style={{
                                position: 'absolute', top: -40, right: -40,
                                width: 120, height: 120, borderRadius: '50%',
                                background: `rgba(${accentRgb}, 0.07)`,
                                filter: 'blur(30px)', pointerEvents: 'none',
                            }} />

                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                <div>
                                    <h3 style={{
                                        fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.95rem',
                                        color: '#fff', letterSpacing: '0.06em', margin: 0,
                                    }}>
                                        <span style={{ color: accent }}>SPECTRAGRID</span> AUTH
                                    </h3>
                                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', margin: '4px 0 0' }}>
                                        JWT Role-Gated Access Control
                                    </p>
                                </div>
                                <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, padding: '4px' }}>✕</button>
                            </div>

                            {/* Preset roles */}
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: accent, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
                                    Quick Demo Persona
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    {presetUsers.map(p => (
                                        <button
                                            key={p.email}
                                            onClick={() => selectPreset(p)}
                                            style={{
                                                padding: '8px 10px',
                                                borderRadius: '5px',
                                                background: username === p.email ? `rgba(${accentRgb}, 0.12)` : 'rgba(255,255,255,0.03)',
                                                border: `1px solid ${username === p.email ? `rgba(${accentRgb},0.4)` : 'rgba(255,255,255,0.07)'}`,
                                                color: username === p.email ? accent : 'rgba(255,255,255,0.6)',
                                                fontFamily: 'var(--font-mono)',
                                                fontSize: '0.72rem',
                                                textAlign: 'left',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s',
                                            }}
                                        >
                                            <div style={{ fontWeight: 600 }}>{p.label}</div>
                                            <div style={{ fontSize: '0.62rem', opacity: 0.55, marginTop: '2px' }}>{p.role}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {['Username / Email', 'Password'].map((label, i) => (
                                    <div key={label}>
                                        <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</label>
                                        <input
                                            type={i === 1 ? 'password' : 'text'}
                                            value={i === 0 ? username : password}
                                            onChange={e => i === 0 ? setUsername(e.target.value) : setPassword(e.target.value)}
                                            required
                                            style={{
                                                width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)',
                                                borderRadius: '5px', padding: '10px 12px', color: '#fff',
                                                fontFamily: 'var(--font-mono)', fontSize: '0.82rem', outline: 'none',
                                                transition: 'border-color 0.2s',
                                                boxSizing: 'border-box',
                                            }}
                                            onFocus={e => (e.target.style.borderColor = `rgba(${accentRgb},0.5)`)}
                                            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')}
                                        />
                                    </div>
                                ))}

                                {errorMsg && (
                                    <div style={{ background: 'rgba(255,0,60,0.08)', border: '1px solid rgba(255,0,60,0.3)', color: '#FF7096', borderRadius: '5px', padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                                        {errorMsg}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        background: loading ? 'rgba(255,255,255,0.06)' : accent,
                                        color: loading ? 'rgba(255,255,255,0.4)' : '#000',
                                        fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.8rem',
                                        letterSpacing: '0.1em', textTransform: 'uppercase',
                                        padding: '12px', borderRadius: '5px', border: 'none',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: loading ? 'none' : `0 0 24px rgba(${accentRgb},0.35)`,
                                        marginTop: '4px',
                                    }}
                                >
                                    {loading ? 'AUTHENTICATING...' : 'SIGN IN TO MISSION CONTROL'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
