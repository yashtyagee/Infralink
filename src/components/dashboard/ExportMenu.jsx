import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

export default function ExportMenu() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (type) => {
    setLoading(true);
    setOpen(false);
    try {
      const url = `${API_BASE}/export/${type}`;
      window.open(url, '_blank');
      
      // Show a toast (simplified for hackathon)
      alert('Report exported successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button 
        onClick={() => setOpen(!open)}
        className="btn"
        style={{ 
          background: 'var(--bg2)', border: '1px solid var(--border-color)', 
          color: 'var(--text-color)', padding: '6px 12px', fontSize: '0.8rem',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}
        disabled={loading}
      >
        {loading ? <Loader2 size={16} className="spinner" /> : <Download size={16} />}
        Export
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: '0', marginTop: '12px',
          width: '260px', background: 'var(--bg-color)', border: '1px solid var(--border-color)',
          borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          zIndex: 100, overflow: 'hidden', color: 'var(--text-color)'
        }}>
          <div style={{ padding: '8px 16px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Entities</div>
          <button onClick={() => handleExport('entities/csv')} className="export-menu-item" style={menuItemStyle}>
            <FileSpreadsheet size={16} color="#22c55e" /> Export Entities (CSV)
          </button>
          <button onClick={() => handleExport('entities/pdf')} className="export-menu-item" style={menuItemStyle}>
            <FileText size={16} color="#ef4444" /> Export Entities (PDF)
          </button>
          
          <div style={{ borderTop: '1px solid var(--border-color)', margin: '4px 0' }}></div>
          
          <div style={{ padding: '8px 16px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Risk Intelligence</div>
          <button onClick={() => handleExport('anomalies/csv')} className="export-menu-item" style={menuItemStyle}>
            <FileSpreadsheet size={16} color="#22c55e" /> Export Anomaly Report (CSV)
          </button>
          <button onClick={() => handleExport('anomalies/pdf')} className="export-menu-item" style={menuItemStyle}>
            <FileText size={16} color="#ef4444" /> Export Anomaly Report (PDF)
          </button>
        </div>
      )}
      <style>{`
        .export-menu-item {
          display: flex; align-items: center; gap: 12px; width: 100%; text-align: left;
          background: transparent; border: none; padding: 10px 16px; color: var(--text-color);
          cursor: pointer; font-size: 0.85rem; transition: background 0.2s;
        }
        .export-menu-item:hover { background: var(--bg2); }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const menuItemStyle = {
  display: 'flex', alignItems: 'center', gap: '12px', width: '100%', textAlign: 'left',
  background: 'transparent', border: 'none', padding: '10px 16px', color: 'var(--text-color)',
  cursor: 'pointer', fontSize: '0.85rem'
};
