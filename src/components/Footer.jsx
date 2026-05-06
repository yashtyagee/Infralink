export default function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="footer__aurora-strip" />
      <div className="container">
        <div className="footer__top" style={{ padding: '40px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="footer__brand">
            <div className="footer__logo" style={{ marginBottom: '8px' }}>
              <span className="navbar__logo-icon">⬡</span>
              <span>Infralink</span>
            </div>
            <p className="footer__sub">Intelligence for GovTech</p>
          </div>

          <div className="footer__cta-box" style={{ background: 'rgba(124, 255, 103, 0.03)', border: '1px solid rgba(124, 255, 103, 0.1)', padding: '12px 24px', borderRadius: '12px', display: 'flex', gap: '20px', alignItems: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>Ready to scale?</p>
            <a href="mailto:demo@infralink.ai" className="btn btn--primary btn--sm">Contact Us</a>
          </div>
        </div>

        <div className="footer__bottom">
          <span>© 2026 Infralink. All rights reserved.</span>
          <div className="footer__ubid-badge">
            <code>UBID-KA-3F91A7C24B</code>
            <span>One identity. Forever.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
