import { useState, useEffect } from 'react';
import LanguageToggle from './LanguageToggle';
import ThemeToggle from './ThemeToggle';

export default function Navbar({ onLaunch }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { label: 'Intelligence', href: '#features' },
    { label: 'Network', href: '#how-it-works' },
  ];

  return (
    <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        <a href="#" className="navbar__logo">
          <span className="navbar__logo-icon">⬡</span>
          <span className="navbar__logo-text">Infralink</span>
        </a>
        <ul className={`navbar__links${menuOpen ? ' navbar__links--open' : ''}`}>
          {links.map(l => (
            <li key={l.label}>
              <a href={l.href} onClick={() => setMenuOpen(false)}>{l.label}</a>
            </li>
          ))}
        </ul>
        <div className="navbar__actions">
          <ThemeToggle />
          <LanguageToggle />
          <button className="btn btn--primary btn--sm" onClick={onLaunch}>
            Launch Platform
          </button>
          <button className="navbar__hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
            <span /><span /><span />
          </button>
        </div>
      </div>
    </nav>
  );
}
