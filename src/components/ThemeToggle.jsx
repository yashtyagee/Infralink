import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme');
    if (savedTheme === 'light') {
      setIsLight(true);
      document.body.classList.add('light-mode');
    }
  }, []);

  const toggleTheme = () => {
    if (isLight) {
      document.body.classList.remove('light-mode');
      localStorage.setItem('app_theme', 'dark');
      setIsLight(false);
    } else {
      document.body.classList.add('light-mode');
      localStorage.setItem('app_theme', 'light');
      setIsLight(true);
    }
  };

  return (
    <button 
      onClick={toggleTheme}
      className="btn"
      style={{
        background: 'transparent', border: 'none', color: 'var(--text-color)',
        padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer'
      }}
      title="Toggle Dark/Light Mode"
    >
      {isLight ? <Moon size={20} color="var(--text-color)" /> : <Sun size={20} color="var(--text-color)" />}
    </button>
  );
}
