import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import Footer from './components/Footer';
import Dashboard from './components/dashboard/Dashboard';
import './App.css';

export default function App() {
  const [page, setPage] = useState('landing');

  useEffect(() => {
    if (page !== 'landing') return;

    // --- SCROLL REVEAL ---
    const revealElements = document.querySelectorAll('h1, h2, h3, h4, p, code, .feature-card, .how-grid, .layer-item');
    revealElements.forEach(el => el.classList.add('reveal-element'));

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -100px 0px' });

    revealElements.forEach(el => observer.observe(el));

    // Handle initial hash scroll
    if (window.location.hash) {
      setTimeout(() => {
        const id = window.location.hash.substring(1);
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    }

    // --- LERP PARALLAX ---
    let currentScroll = window.scrollY;
    let targetScroll = window.scrollY;
    let rafId;

    const updateScroll = () => {
      currentScroll += (targetScroll - currentScroll) * 0.1;
      rafId = requestAnimationFrame(updateScroll);
    };

    const onScroll = () => {
      targetScroll = window.scrollY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    rafId = requestAnimationFrame(updateScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
      observer.disconnect();
      document.querySelectorAll('.reveal-element').forEach(el => {
        el.classList.remove('reveal-element', 'revealed');
      });
    };
  }, [page]);

  if (page === 'dashboard') {
    return <Dashboard onBack={() => setPage('landing')} />;
  }

  return (
    <>
      <Navbar onLaunch={() => setPage('dashboard')} />
      <main>
        <Hero onLaunch={() => setPage('dashboard')} />
        <Features />
        <HowItWorks />
      </main>
      <Footer onLaunch={() => setPage('dashboard')} />
    </>
  );
}
