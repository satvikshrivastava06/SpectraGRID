import { useState } from 'react';

// ─── Simulated dMRV ledger entries ────────────────────────────────────────
const DMRV_LEDGER = [
    { hash: '0x3fa8...d2c1', event: 'CO₂ offset verified', value: '2.14 tCO₂e', timestamp: '2026-07-16 18:41:02', standard: 'GHG Protocol' },
    { hash: '0xa91c...f7b3', event: 'PV generation attested', value: '138 kWh', timestamp: '2026-07-16 17:00:00', standard: 'GRI 302' },
    { hash: '0xbc24...aa6e', event: 'Water conservation logged', value: '4,200 L', timestamp: '2026-07-15 09:15:44', standard: 'GRI 303' },
    { hash: '0x5ff1...3d09', event: 'Green skills hours recorded', value: '12 hrs', timestamp: '2026-07-14 14:30:00', standard: 'SDG 8' },
    { hash: '0xe208...19ca', event: 'Avoided roof inspection', value: '1 inspection', timestamp: '2026-07-13 11:00:00', standard: 'CSRD Annex II' },
];

// ─── SDG Contributions ────────────────────────────────────────────────────
const SDG_ITEMS = [
    { id: 7, label: 'Affordable & Clean Energy', pct: 92, color: '#FCC30B', icon: '☀️' },
    { id: 9, label: 'Industry, Innovation & Infrastructure', pct: 68, color: '#FD6925', icon: '🏭' },
    { id: 11, label: 'Sustainable Cities & Communities', pct: 74, color: '#FD9D24', icon: '🏙️' },
    { id: 13, label: 'Climate Action', pct: 88, color: '#3F7E44', icon: '🌍' },
    { id: 17, label: 'Partnerships for the Goals', pct: 55, color: '#19486A', icon: '🤝' },
];

// ─── Downloadable Report Types ────────────────────────────────────────────
type ReportStandard = 'GHG Protocol' | 'GRI Standards' | 'CSRD' | 'IFRS Sustainability';
const REPORT_CONFIGS: { standard: ReportStandard; filename: string; color: string; description: string }[] = [
    { standard: 'GHG Protocol', filename: 'spectragrid_ghg_protocol_scope2_report.csv', color: 'var(--color-emerald)', description: 'Scope 1, 2 & 3 emissions inventory with grid emission factor attribution.' },
    { standard: 'GRI Standards', filename: 'spectragrid_gri_302_303_305_report.pdf', color: 'var(--color-cyan)', description: 'GRI 302 (Energy), 303 (Water), 305 (Emissions) disclosures.' },
    { standard: 'CSRD', filename: 'spectragrid_csrd_annex_ii_esrs_e1.csv', color: 'var(--color-violet)', description: 'ESRS E1 climate-related disclosures aligned with EU Taxonomy.' },
    { standard: 'IFRS Sustainability', filename: 'spectragrid_ifrs_s1_s2_climate_report.xlsx', color: 'var(--color-gold)', description: 'IFRS S2 climate-related risks and opportunities disclosure pack.' },
];

function downloadSimulatedReport(filename: string, standard: string) {
    // Generate a CSV string with simulated data
    const csvLines = [
        `SpectraGRID Climate Report — ${standard}`,
        `Generated: ${new Date().toISOString()}`,
        ``,
        `Metric,Value,Standard,Unit`,
        `Expected Production,138,${standard},kWh`,
        `Actual Production,104,${standard},kWh`,
        `Ghost Generation,34,${standard},kWh`,
        `Avoided CO2 Emissions,21.3,${standard},tCO2e`,
        `Water Saved,4200,${standard},L`,
        `Green Skills Training,12,${standard},hours`,
        `Performance Ratio,84.5,${standard},%`,
        `ESG Health Score,92,${standard},/100`,
        `Renewable Penetration,94.3,${standard},%`,
    ];
    const blob = new Blob([csvLines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export default function ESGIntelligenceUI() {
    const [downloading, setDownloading] = useState<string | null>(null);

    const handleDownload = (cfg: typeof REPORT_CONFIGS[0]) => {
        setDownloading(cfg.standard);
        setTimeout(() => {
            downloadSimulatedReport(cfg.filename, cfg.standard);
            setDownloading(null);
        }, 900);
    };

    return (
        <section id="esg-intelligence" className="section">
            <div className="section-inner" style={{ maxWidth: '1440px' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                    <div className="section-eyebrow">// Carbon Integrity Ledger</div>
                    <h2 className="section-title">Climate Impact Intelligence</h2>
                    <p className="section-subtitle" style={{ margin: '0 auto', maxWidth: '600px' }}>
                        Auditable digital MRV calculations, SDG alignment tracking, and ecosystem-level impact reporting aligned with global standards.
                    </p>
                </div>

                {/* ── Row 1: Climate KPI Cards ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px', marginBottom: '40px' }}>
                    {[
                        { label: 'Avoided Emissions', value: '21.3 t', sub: 'CO₂e offset', color: 'var(--color-emerald)', icon: '🌿' },
                        { label: 'Water Saved', value: '4,200 L', sub: 'vs coal baseline', color: 'var(--color-cyan)', icon: '💧' },
                        { label: 'Avoided Inspections', value: '14', sub: 'AI-replaced audits', color: 'var(--color-gold)', icon: '🛰️' },
                        { label: 'Green Skills Training', value: '120 hrs', sub: 'technicians upskilled', color: 'var(--color-violet)', icon: '🎓' },
                        { label: 'ESG Performance', value: 'A+', sub: 'Audit verified', color: 'var(--color-cyan)', icon: '⭐' },
                        { label: 'Renewable Penetration', value: '94.3%', sub: 'Campus microgrid', color: 'var(--color-emerald)', icon: '☀️' },
                    ].map(card => (
                        <div key={card.label} className="glass-panel" style={{ padding: '22px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>{card.icon}</div>
                            <div className="mono" style={{ fontSize: '0.65rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{card.label}</div>
                            <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 700, color: card.color }}>{card.value}</div>
                            <div className="mono" style={{ fontSize: '0.65rem', opacity: 0.4, marginTop: '4px' }}>{card.sub}</div>
                        </div>
                    ))}
                </div>

                {/* ── Row 2: dMRV Ledger + SDG Mapping ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '32px', marginBottom: '40px' }}>

                    {/* dMRV Ledger */}
                    <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '0' }}>
                        <div className="mono" style={{ fontSize: '0.8rem', letterSpacing: '1px', opacity: 0.5, marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              // dMRV IMMUTABLE AUDIT LEDGER
                            <span style={{ marginLeft: '12px', color: 'var(--color-emerald)', fontSize: '0.7rem' }}>● LIVE</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                            {DMRV_LEDGER.map((entry, i) => (
                                <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto auto', gap: '12px', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--color-cyan)', opacity: 0.7 }}>{entry.hash}</span>
                                    <span className="mono" style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)' }}>{entry.event}</span>
                                    <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-gold)' }}>{entry.value}</span>
                                    <span className="mono" style={{ fontSize: '0.65rem', opacity: 0.4 }}>{entry.standard}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mono" style={{ fontSize: '0.7rem', opacity: 0.3, marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            Entries cryptographically signed. Tamper-evident audit chain. On-chain verification available.
                        </div>
                    </div>

                    {/* SDG Contribution Tracker */}
                    <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="mono" style={{ fontSize: '0.8rem', letterSpacing: '1px', opacity: 0.5, marginBottom: '0' }}>
              // SDG CONTRIBUTION MAPPING
                        </div>
                        {SDG_ITEMS.map(sdg => (
                            <div key={sdg.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{
                                            background: sdg.color, color: '#FFF', fontWeight: 700,
                                            fontSize: '0.7rem', padding: '2px 7px', borderRadius: '3px', fontFamily: 'var(--font-mono)'
                                        }}>SDG {sdg.id}</span>
                                        <span className="mono" style={{ fontSize: '0.78rem', opacity: 0.75 }}>{sdg.label}</span>
                                    </span>
                                    <span className="mono" style={{ fontSize: '0.85rem', color: sdg.color, fontWeight: 600 }}>{sdg.pct}%</span>
                                </div>
                                <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px' }}>
                                    <div style={{ height: '100%', width: `${sdg.pct}%`, background: sdg.color, borderRadius: '2px', transition: 'width 1s ease' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Row 3: Downloadable ESG Reports ── */}
                <div className="glass-panel" style={{ padding: '32px' }}>
                    <div className="mono" style={{ fontSize: '0.8rem', letterSpacing: '1px', opacity: 0.5, marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            // DOWNLOADABLE ESG REPORTS — INTERNATIONAL STANDARD ALIGNMENT
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                        {REPORT_CONFIGS.map(cfg => (
                            <div key={cfg.standard} style={{
                                padding: '20px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px',
                                display: 'flex', flexDirection: 'column', gap: '12px',
                                background: 'rgba(255,255,255,0.01)',
                                transition: 'border 0.2s'
                            }}
                                onMouseEnter={e => (e.currentTarget.style.borderColor = cfg.color)}
                                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <span className="mono" style={{ fontWeight: 700, color: cfg.color, fontSize: '0.9rem' }}>{cfg.standard}</span>
                                    <span className="mono" style={{ fontSize: '0.6rem', opacity: 0.4, marginTop: '2px' }}>CSV</span>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, margin: 0 }}>{cfg.description}</p>
                                <button
                                    onClick={() => handleDownload(cfg)}
                                    disabled={downloading !== null}
                                    className="mono"
                                    style={{
                                        marginTop: 'auto', padding: '10px', borderRadius: '4px', fontSize: '0.78rem',
                                        background: downloading === cfg.standard ? cfg.color : 'rgba(255,255,255,0.04)',
                                        color: downloading === cfg.standard ? '#000' : '#FFF',
                                        border: `1px solid ${downloading === cfg.standard ? cfg.color : 'rgba(255,255,255,0.08)'}`,
                                        cursor: downloading ? 'wait' : 'pointer',
                                        fontWeight: 600, transition: 'all 0.2s'
                                    }}
                                >
                                    {downloading === cfg.standard ? '⟳ Generating...' : '↓ Download Report'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
}
