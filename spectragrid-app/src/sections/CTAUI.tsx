export default function CTAUI() {
    return (
        <section id="cta" className="section" style={{ minHeight: '60vh' }}>
            <div className="section-inner" style={{ textAlign: 'center' }}>
                <h2 className="section-title">Bring Prescriptive Intelligence to Your Solar Infrastructure</h2>
                <p className="section-subtitle" style={{ margin: '0 auto 40px auto' }}>
                    Stop letting invisible losses degrade your physical assets. Calibrate your first pvlib twin in minutes.
                </p>
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                    <button className="btn-primary mono">DEPLOY TWIN INSTANCE</button>
                    <button className="btn-ghost mono">EXPLORE GITHUB REPO</button>
                </div>
            </div>
        </section>
    );
}
