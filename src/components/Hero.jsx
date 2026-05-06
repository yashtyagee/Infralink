import { useEffect, useRef } from 'react';
import Aurora from './Aurora';

export default function Hero({ onLaunch }) {
  const badgeRef = useRef(null);

  useEffect(() => {
    const el = badgeRef.current;
    if (!el) return;
    setTimeout(() => el.classList.add('badge--visible'), 300);
  }, []);

  return (
    <section className="hero" id="hero">
      {/* Aurora background */}
      <Aurora
        colorStops={['#7cff67', '#B497CF', '#5227FF']}
        blend={0.5}
        amplitude={1.0}
        speed={0.8}
      />

      {/* Radial dark overlay so text is readable */}
      <div className="hero__overlay" />

      <div className="hero__content">
        <div ref={badgeRef} className="badge">
          <span className="badge__dot" />
          GovTech · AI · Knowledge Graph
        </div>

        <h1 className="hero__title">
          One Identity.<br />
          <span className="gradient-text">Infinite Intelligence.</span>
        </h1>

        <p className="hero__subtitle" style={{ maxWidth: '580px' }}>
          One authoritative <strong>UBID</strong> for every business. 
          Resolving fragmented government records with AI-powered intelligence.
        </p>

        <div className="hero__ubid-example">
          <span className="ubid-label">Sample UBID</span>
          <code className="ubid-code">UBID-KA-3F91A7C24B</code>
        </div>

        <div className="hero__cta">
          <button className="btn btn--primary btn--lg" onClick={onLaunch}>
            Launch Platform
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
          <a href="#how-it-works" className="btn btn--ghost btn--lg">See How It Works</a>
        </div>
      </div>

      <div className="hero__scroll-hint">
        <span>Scroll to explore</span>
        <div className="hero__scroll-arrow" />
      </div>
    </section>
  );
}
