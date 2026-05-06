import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertTriangle, FileSpreadsheet, GitMerge, Network, Users, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API = 'http://localhost:8000';

export default function CSVUpload({ onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const inputRef = useRef(null);

  const handleDrag = function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = function(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = function(e) {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      setResult(null);
      setAnalysisData(null);
    } else {
      setResult({ error: 'Please upload a valid CSV file.' });
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    setAnalysisData(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API}/api/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: data.message });
        setAnalysisData(data);
        setFile(null);
        if (onUploadSuccess) onUploadSuccess();
      } else {
        setResult({ error: data.detail || data.error || 'Upload failed' });
      }
    } catch (err) {
      setResult({ error: `Network error: make sure backend is running on port 8000` });
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="dash-card" style={{ marginBottom: '32px' }}
    >
      <h3 className="dash-card-title" style={{ marginBottom: '16px' }}>
        <FileSpreadsheet size={18} /> Bulk Data Ingestion
      </h3>
      
      <div 
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current.click()}
        style={{
          border: `2px dashed ${dragActive ? 'var(--green)' : 'var(--border-color)'}`,
          borderRadius: '12px', padding: '40px 24px', textAlign: 'center',
          background: dragActive ? 'rgba(124, 255, 103, 0.05)' : 'var(--bg2)',
          cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative'
        }}
      >
        <input 
          ref={inputRef} type="file" accept=".csv" 
          onChange={handleChange} style={{ display: 'none' }} 
        />
        
        {!file ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <UploadCloud size={36} color={dragActive ? 'var(--green)' : 'var(--text-muted)'} />
            <div>
              <p style={{ fontWeight: '600', marginBottom: '4px' }}>Drag & Drop your CSV file here</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>or click to browse from your computer</p>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>Required columns: name, address, department, phone</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <FileSpreadsheet size={36} color="var(--primary)" />
            <p style={{ fontWeight: '600', color: 'var(--green)' }}>{file.name}</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(1)} KB</p>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
        <div style={{ flex: 1 }}>
          {result?.success && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--green)', fontSize: '0.85rem' }}>
              <CheckCircle2 size={16} /> {result.success}
            </div>
          )}
          {result?.error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '0.85rem' }}>
              <AlertTriangle size={16} /> {result.error}
            </div>
          )}
        </div>
        
        <div 
          className={`animated-border-container ${uploading ? 'animating' : ''}`}
          style={{
            position: 'relative',
            borderRadius: '12px',
            padding: '2px',
            overflow: 'hidden',
            display: 'inline-block',
            opacity: (!file && !uploading) ? 0.5 : 1,
            cursor: (!file && !uploading) ? 'not-allowed' : 'pointer'
          }}
          onClick={(e) => {
            if (!file || uploading) return;
            handleUpload(e);
          }}
        >
          {uploading && (
            <div className="animated-border-gradient" />
          )}
          <button 
            disabled={!file || uploading}
            style={{ 
              position: 'relative',
              background: 'linear-gradient(135deg, var(--green), #4ef72d)',
              color: '#050a00',
              borderRadius: '10px',
              padding: '12px 24px',
              fontWeight: '600',
              border: 'none',
              cursor: (!file && !uploading) ? 'not-allowed' : 'pointer',
              zIndex: 2,
              whiteSpace: 'nowrap',
              width: '100%',
              minWidth: '180px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: uploading ? 'none' : '0 4px 24px rgba(124,255,103,0.35)'
            }}
          >
            {uploading ? 'Running AI Pipeline...' : 'Upload & Process'}
          </button>
        </div>
      </div>

      {/* ── Live Analysis Results Panel ─────────────────────────────────────── */}
      <AnimatePresence>
        {analysisData && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ marginTop: '24px', overflow: 'hidden' }}
          >
            <div style={{
              background: 'rgba(124, 255, 103, 0.05)',
              border: '1px solid rgba(124, 255, 103, 0.2)',
              borderRadius: '12px',
              padding: '20px'
            }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--green)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} /> AI Pipeline Completed — Live Analysis
              </h4>
              
              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: 'var(--bg2)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--green)' }}>
                    {analysisData.records_ingested || 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Records Ingested</div>
                </div>
                <div style={{ background: 'var(--bg2)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#38bdf8' }}>
                    {analysisData.matching?.auto_merged || 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Auto-Merged</div>
                </div>
                <div style={{ background: 'var(--bg2)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#f59e0b' }}>
                    {analysisData.matching?.pending_review || 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Pending Review</div>
                </div>
                <div style={{ background: 'var(--bg2)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#b497cf' }}>
                    {analysisData.clustering?.ubid_profiles_total || 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>UBID Profiles</div>
                </div>
              </div>

              {/* UBID clusters generated */}
              {analysisData.clustering?.profiles?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Network size={14} /> Unified Identities Created
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                    {analysisData.clustering.profiles.map((p) => (
                      <div key={p.ubid} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'var(--bg2)',
                        borderRadius: '8px',
                        padding: '10px 14px'
                      }}>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{p.canonical_name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.ubid}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Layers size={12} /> {p.record_count} records
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Users size={12} /> {(p.departments || []).join(', ') || '—'}
                          </span>
                          <span className="dash-badge success" style={{ fontSize: '0.65rem' }}>
                            <GitMerge size={10} style={{ display: 'inline', marginRight: 3 }} />
                            Merged
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .animated-border-container {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .animated-border-container:not(.animating):hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(124, 255, 103, 0.5);
        }
        .animated-border-gradient {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: conic-gradient(transparent, transparent, transparent, var(--green), var(--purple), var(--indigo), var(--green));
          animation: spin-border 2s linear infinite;
          z-index: 1;
        }
        @keyframes spin-border {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  );
}
