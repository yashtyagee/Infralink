import React, { createContext, useState, useContext, useEffect } from 'react';
import en from '../locales/en.json';
import kn from '../locales/kn.json';

const LanguageContext = createContext();

export const translations = { en, kn };

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    const saved = localStorage.getItem('app_lang');
    if (saved && (saved === 'en' || saved === 'kn')) {
      setLang(saved);
    }
  }, []);

  const toggleLanguage = () => {
    const newLang = lang === 'en' ? 'kn' : 'en';
    setLang(newLang);
    localStorage.setItem('app_lang', newLang);
  };

  const t = (key) => {
    if (translations[lang] && translations[lang][key]) {
      return translations[lang][key];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
