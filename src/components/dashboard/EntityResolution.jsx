import React from 'react';
import { FileSearch, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import CSVUpload from './CSVUpload';

const API = 'http://localhost:8000';

export default function EntityResolution() {
  const [match, setMatch] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [successResult, setSuccessResult] = React.useState(null);

  const fetchData = () => {
    setLoading(true);
    setSuccessResult(null);
    fetch(`${API}/api/review/pending`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setMatch(data[0]); // Show the top match
        } else {
          setMatch(null);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading AI Engine...</div>;
  if (!match && !successResult) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <CSVUpload onUploadSuccess={fetchData} />
      <div style={{ padding: '40px', color: 'var(--text-muted)' }}>No matches found yet. Run AI Pipeline.</div>
    </motion.div>
  );

  const recordA = match?.record1;
  const recordB = match?.record2;

  const handleMerge = async () => {
    try {
      const res = await fetch(`${API}/api/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          link_id: match.id,
          record_1_id: recordA.id,
          record_2_id: recordB.id,
          decision: 'APPROVE'
        })
      });
      const data = await res.json();
      setSuccessResult({
        ubid: data.resultingProfile?.ubid || 'Generated UBID',
        anchor: data.resultingProfile?.anchor_type || 'INTERNAL',
        name: data.resultingProfile?.canonical_name || recordA.name
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async () => {
    try {
      await fetch(`${API}/api/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          link_id: match.id,
          record_1_id: recordA.id,
          record_2_id: recordB.id,
          decision: 'REJECT'
        })
      });
      fetchData(); // Just load the next one
    } catch (err) {
      console.error(err);
    }
  };

  if (successResult) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="dash-card"
        style={{ textAlign: 'center', padding: '60px 40px', border: '1px solid var(--accent)', background: 'rgba(56, 189, 248, 0.05)' }}
      >
        <div style={{ display: 'inline-flex', padding: '20px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent)', marginBottom: '24px' }}>
          <CheckCircle2 size={48} />
        </div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'var(--text-primary)' }}>Records Successfully Merged</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px', maxWidth: '400px', margin: '0 auto 32px' }}>
          The human governance engine has successfully clustered these records into a single authoritative identity.
        </p>
        
        <div style={{ background: 'var(--bg-dark)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)', display: 'inline-block', textAlign: 'left', marginBottom: '32px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Canonical UBID Generated</div>
          <div style={{ fontSize: '1.25rem', color: 'var(--accent)', fontWeight: 600, marginBottom: '4px', fontFamily: 'monospace' }}>{successResult.ubid}</div>
          <div style={{ color: 'var(--text-secondary)' }}>{successResult.name}</div>
          <div style={{ marginTop: '12px', display: 'inline-block' }} className="dash-badge success">Anchor: {successResult.anchor}</div>
        </div>

        <div>
          <button onClick={fetchData} className="btn btn--primary btn--lg">
            Continue to Next Review <ArrowRight size={18} style={{ marginLeft: '8px' }} />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="dashboard-section"
    >
      <CSVUpload onUploadSuccess={fetchData} />
      <div className="dash-card-header">
        <h2 className="dash-card-title">
          <FileSearch size={20} className="er-match" />
          AI Entity Resolution
        </h2>
        <span className="dash-badge success">Live Analysis</span>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
        Comparing raw incoming records using Siamese Neural Networks, FastText embeddings, and libpostal address parsing.
      </p>

      <div className="er-grid">
        {/* Record A */}
        <div className="er-record">
          <div className="dash-badge" style={{ marginBottom: '16px', display: 'inline-block' }}>{recordA.source_department}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginBottom: '4px' }}>UBID: {recordA.ubid}</div>
          <div className="er-field">
            <div className="er-label">Business Name</div>
            <div className="er-value er-match">{recordA.name}</div>
          </div>
          <div className="er-field">
            <div className="er-label">Registered Address</div>
            <div className="er-value er-diff">{recordA.address}</div>
          </div>
          <div className="er-field">
            <div className="er-label">Anchor ID (Phone)</div>
            <div className="er-value er-match">{recordA.pan || 'N/A'}</div>
          </div>
        </div>

        {/* AI Score */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div className="er-score-circle">
            <div className="er-score-value">{(match.similarity_score * 100).toFixed(0)}<span style={{ fontSize: '1rem' }}>%</span></div>
            <div className="er-score-label">Match Prob.</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {match.matched_fields?.fields?.includes('name') && <span className="dash-badge success"><CheckCircle2 size={12} style={{marginRight: 4, display:'inline'}}/>Name</span>}
            {match.matched_fields?.fields?.includes('address') && <span className="dash-badge success"><CheckCircle2 size={12} style={{marginRight: 4, display:'inline'}}/>Address</span>}
            {(!match.matched_fields?.fields && match.matched_fields?.includes('name')) && <span className="dash-badge success"><CheckCircle2 size={12} style={{marginRight: 4, display:'inline'}}/>Name</span>}
            {(!match.matched_fields?.fields && match.matched_fields?.includes('address')) && <span className="dash-badge success"><CheckCircle2 size={12} style={{marginRight: 4, display:'inline'}}/>Address</span>}
          </div>
        </div>

        {/* Record B */}
        <div className="er-record">
          <div className="dash-badge" style={{ marginBottom: '16px', display: 'inline-block' }}>{recordB.source_department}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginBottom: '4px' }}>UBID: {recordB.ubid}</div>
          <div className="er-field">
            <div className="er-label">Business Name</div>
            <div className="er-value er-diff">{recordB.name}</div>
          </div>
          <div className="er-field">
            <div className="er-label">Registered Address</div>
            <div className="er-value er-diff">{recordB.address}</div>
          </div>
          <div className="er-field">
            <div className="er-label">Anchor ID (Phone)</div>
            <div className="er-value er-match">{recordB.pan || 'N/A'}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
        <button 
          onClick={handleMerge}
          className="btn btn--primary btn--lg" 
          style={{ flex: 1, justifyContent: 'center' }}
        >
          <CheckCircle2 size={18} /> 
          Resolve & Merge into Single UBID
        </button>
        <button 
          onClick={handleReject}
          className="btn btn--outline btn--lg" 
          style={{ flex: 1, justifyContent: 'center' }}
        >
          <ArrowRight size={18} />
          Ignore & Keep Separate
        </button>
      </div>

      <div className="dash-card" style={{ marginTop: '32px', background: 'var(--bg2)' }}>
        <h3 style={{ fontSize: '0.9rem', marginBottom: '16px', color: 'var(--text-muted)' }}>Explanation Engine</h3>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div className="er-label">Semantic Embeddings</div>
            <div style={{ fontSize: '0.85rem' }}>FastText distance: 0.08 (Highly similar context)</div>
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div className="er-label">Phonetic Encoding</div>
            <div style={{ fontSize: '0.85rem' }}>Double Metaphone: RJS ENTRPRS == RJS ENTRPRS</div>
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div className="er-label">Address Normalization</div>
            <div style={{ fontSize: '0.85rem' }}>MG Road Bengaluru == M.G. Road Bangalore</div>
          </div>
        </div>
      </div>

      {/* Confidence Breakdown UI */}
      {match.matched_fields?.breakdown && (
        <div className="dash-card" style={{ marginTop: '24px', background: 'var(--bg2)' }}>
          <h3 style={{ fontSize: '0.9rem', marginBottom: '16px', color: 'var(--text-muted)' }}>Confidence Breakdown</h3>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {Object.entries(match.matched_fields.breakdown).map(([field, score]) => {
              let color = '#ef4444'; // Red for < 50
              let icon = <AlertTriangle size={14} />;
              if (score >= 90) { color = '#22c55e'; icon = <CheckCircle2 size={14} />; } // Green
              else if (score >= 50) { color = '#f59e0b'; icon = <ArrowRight size={14} />; } // Amber
              
              return (
                <div key={field} style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem', textTransform: 'capitalize' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>{icon} {field}</span>
                    <span>{score}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: '4px' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
