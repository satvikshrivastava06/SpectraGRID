import { SpectraLogo } from './branding';

export default function Footer() {
    return (
        <footer style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '40px 80px',
            background: '#0F1115',
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: '0.8rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '100px',
            position: 'relative',
            zIndex: 10
        }}>
            <div style={{ flex: 1 }}>
                <SpectraLogo
                    variant="navbar"
                    accent="var(--brand-accent)"
                    animate={false}
                    showWordmark
                />
                <p style={{ marginTop: '12px', letterSpacing: '0.06em' }}>
                    Autonomous Renewable Asset Intelligence & Digital Twins
                </p>
            </div>
            <div style={{ flex: 1, textAlign: 'right' }} className="mono">
                © 2026 Spectra<strong style={{ color: 'var(--brand-accent)', fontWeight: 800 }}>GRID</strong>. Calibrated for 150 kWp Jabalpur Campus.
            </div>
        </footer>
    );
}
