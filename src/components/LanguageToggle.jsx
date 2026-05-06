import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export default function LanguageToggle() {
  const { lang, toggleLanguage } = useLanguage();
  
  return (
    <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)' }}>
      <button 
        onClick={() => lang !== 'en' && toggleLanguage()}
        className={`nav-lang-btn ${lang === 'en' ? 'active' : ''}`}
        style={{ border: 'none', padding: '4px 10px' }}
      >
        EN
      </button>
      <button 
        onClick={() => lang !== 'kn' && toggleLanguage()}
        className={`nav-lang-btn ${lang === 'kn' ? 'active' : ''}`}
        style={{ border: 'none', padding: '4px 10px' }}
      >
        KN
      </button>
    </div>
  );
}
