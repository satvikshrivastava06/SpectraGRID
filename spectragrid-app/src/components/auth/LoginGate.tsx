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
                        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        animate={{ opacity: 1, backdropFilter: 'blur(16px)' }}
                        exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 9000,
                            background: 'radial-gradient(circle at 50% -20%, rgba(6, 8, 14, 0.6) 0%, rgba(6, 8, 14, 0.95) 100%)',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'center',
                            padding: '12vh 16px 16px',
                        }}
                        onClick={e => { if (e.target === e.currentTarget) setIsOpen(false); }}
                    >
                        <motion.div
                            key="login-panel"
                            initial={{ opacity: 0, scale: 0.95, y: -60, rotateX: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -40, rotateX: -10 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.9 }}
                            style={{
                                background: 'linear-gradient(180deg, rgba(18, 20, 28, 0.93) 0%, rgba(10, 11, 16, 0.98) 100%)',
                                backdropFilter: 'blur(32px)',
                                WebkitBackdropFilter: 'blur(32px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '16px',
                                width: '100%',
                                maxWidth: '440px',
                                padding: '40px',
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: `0 40px 100px -20px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.05) inset, 0 10px 40px -10px rgba(${accentRgb}, 0.2)`,
                                transformPerspective: 1200,
                            }}
                        >
                            {/* Premium ambient glows */}
                            <div style={{
                                position: 'absolute', top: -60, left: '20%', right: '20%', height: 120,
                                background: `radial-gradient(ellipse at top, rgba(${accentRgb}, 0.25) 0%, transparent 70%)`,
                                pointerEvents: 'none', zIndex: 0
                            }} />
                            
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                {/* Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                                    <div>
                                        <h3 style={{
                                            fontFamily: 'var(--font-brand, var(--font-sans))', fontWeight: 600, fontSize: '1.4rem',
                                            color: '#fff', letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: '8px'
                                        }}>
                                            <span style={{ 
                                                width: 8, height: 8, borderRadius: '50%', background: accent,
                                                boxShadow: `0 0 12px ${accent}`
                                            }} />
                                            Mission Control
                                        </h3>
                                        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', margin: '6px 0 0', fontWeight: 300 }}>
                                            Authenticate to access SpectraGRID core.
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setIsOpen(false)} 
                                        style={{ 
                                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
                                            color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '1.2rem', 
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

                                {/* Preset roles */}
                                <div style={{ marginBottom: '28px' }}>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
                                        Fast-path Personas
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        {presetUsers.map(p => {
                                            const isActive = username === p.email;
                                            return (
                                                <button
                                                    key={p.email}
                                                    onClick={() => selectPreset(p)}
                                                    style={{
                                                        padding: '12px 14px',
                                                        borderRadius: '8px',
                                                        background: isActive ? `rgba(${accentRgb}, 0.08)` : 'rgba(255,255,255,0.02)',
                                                        border: `1px solid ${isActive ? `rgba(${accentRgb},0.3)` : 'rgba(255,255,255,0.05)'}`,
                                                        color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                                                        textAlign: 'left',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
                                                        boxShadow: isActive ? `0 4px 12px rgba(${accentRgb}, 0.1)` : 'none',
                                                    }}
                                                    onMouseEnter={e => {
                                                        if (!isActive) {
                                                            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                                                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
                                                        }
                                                    }}
                                                    onMouseLeave={e => {
                                                        if (!isActive) {
                                                            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
                                                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)';
                                                        }
                                                    }}
                                                >
                                                    <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: '0.85rem' }}>{p.label}</div>
                                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: isActive ? accent : 'rgba(255,255,255,0.3)', marginTop: '4px' }}>{p.role}</div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                    {['Email Address', 'Password'].map((label, i) => (
                                        <div key={label} style={{ position: 'relative' }}>
                                            <input
                                                type={i === 1 ? 'password' : 'text'}
                                                value={i === 0 ? username : password}
                                                onChange={e => i === 0 ? setUsername(e.target.value) : setPassword(e.target.value)}
                                                required
                                                placeholder={label}
                                                style={{
                                                    width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)',
                                                    borderRadius: '8px', padding: '14px 16px', color: '#fff',
                                                    fontFamily: 'var(--font-mono)', fontSize: '0.85rem', outline: 'none',
                                                    transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                                                    boxSizing: 'border-box',
                                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
                                                }}
                                                onFocus={e => {
                                                    (e.target.style.borderColor = `rgba(${accentRgb}, 0.5)`);
                                                    (e.target.style.background = 'rgba(0,0,0,0.4)');
                                                    (e.target.style.boxShadow = `inset 0 2px 4px rgba(0,0,0,0.2), 0 0 0 3px rgba(${accentRgb}, 0.1)`);
                                                }}
                                                onBlur={e => {
                                                    (e.target.style.borderColor = 'rgba(255,255,255,0.08)');
                                                    (e.target.style.background = 'rgba(0,0,0,0.2)');
                                                    (e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.2)');
                                                }}
                                            />
                                        </div>
                                    ))}

                                    {errorMsg && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }} 
                                            animate={{ opacity: 1, height: 'auto' }}
                                            style={{ 
                                                background: 'rgba(255,0,60,0.08)', border: '1px solid rgba(255,0,60,0.3)', 
                                                color: '#FF7096', borderRadius: '6px', padding: '12px 14px', 
                                                fontFamily: 'var(--font-sans)', fontSize: '0.8rem', display: 'flex', gap: '8px', alignItems: 'center'
                                            }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                            </svg>
                                            {errorMsg}
                                        </motion.div>
                                    )}

                                    <motion.button
                                        type="submit"
                                        disabled={loading}
                                        whileHover={!loading ? { scale: 1.02 } : {}}
                                        whileTap={!loading ? { scale: 0.98 } : {}}
                                        style={{
                                            background: loading ? 'rgba(255,255,255,0.06)' : accent,
                                            color: loading ? 'rgba(255,255,255,0.3)' : '#000',
                                            fontFamily: 'var(--font-brand, var(--font-sans))', fontWeight: 600, fontSize: '0.9rem',
                                            letterSpacing: '0.02em',
                                            padding: '14px', borderRadius: '8px', border: 'none',
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            transition: 'background 0.3s, color 0.3s',
                                            boxShadow: loading ? 'none' : `0 8px 24px -6px rgba(${accentRgb}, 0.5), inset 0 1px 0 rgba(255,255,255,0.4)`,
                                            marginTop: '8px',
                                            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
                                        }}
                                    >
                                        {loading ? (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <motion.span 
                                                    animate={{ rotate: 360 }}
                                                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                                    style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} 
                                                />
                                                Authenticating...
                                            </span>
                                        ) : 'Sign In'}
                                    </motion.button>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
