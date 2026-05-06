import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, Shield, ShieldCheck, Activity } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

export default function RiskIntelligence() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/anomalies`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, []);

  const evaluateAnomalies = async () => {
    setEvaluating(true);
    try {
      await fetch(`${API_BASE}/anomalies/evaluate`, { method: 'POST' });
      await fetchAnomalies();
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluating(false);
    }
  };

  const renderRiskScore = (score) => {
    let color = '#22c55e'; // green
    if (score >= 80) color = '#ef4444'; // red
    else if (score >= 50) color = '#f59e0b'; // amber

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ 
          width: '40px', height: '40px', borderRadius: '50%', 
          background: `conic-gradient(${color} ${score}%, transparent 0)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative'
        }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
            {score}
          </div>
        </div>
      </div>
    );
  };

  if (loading && !data) {
    return <div className="panel" style={{ padding: '24px' }}>Loading Risk Intelligence...</div>;
  }

  const { stats = { total: 0, high: 0, medium: 0, low: 0 }, data: anomalies = [] } = data || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Anomaly Detection & Fraud Prevention</h2>
        <button 
          onClick={evaluateAnomalies} 
          disabled={evaluating}
          className="btn btn--primary"
        >
          {evaluating ? 'Running Scanner...' : 'Run Risk Scanner'}
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div className="panel" style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', color: '#ef4444' }}>
              <ShieldAlert size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-subtle)' }}>High Risk</h3>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{stats.high}</p>
        </div>
        
        <div className="panel" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ padding: '8px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', color: '#f59e0b' }}>
              <AlertTriangle size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-subtle)' }}>Medium Risk</h3>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{stats.medium}</p>
        </div>
        
        <div className="panel" style={{ borderLeft: '4px solid #eab308' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ padding: '8px', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '8px', color: '#eab308' }}>
              <Shield size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-subtle)' }}>Low Risk</h3>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{stats.low}</p>
        </div>
      </div>

      {/* Table */}
      <div className="panel">
        <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Detected Anomalies</h3>
        {anomalies.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-subtle)' }}>
            <ShieldCheck size={48} style={{ margin: '0 auto 16px', opacity: 0.5, color: '#22c55e' }} />
            <p>No anomalies detected in the system.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--text-subtle)' }}>UBID</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-subtle)' }}>Risk Score</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-subtle)' }}>Anomaly Type</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-subtle)' }}>Reason</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-subtle)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.map(anomaly => (
                  <tr key={anomaly.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>{anomaly.ubid || 'N/A'}</td>
                    <td style={{ padding: '12px 16px' }}>{renderRiskScore(anomaly.risk_score)}</td>
                    <td style={{ padding: '12px 16px', fontWeight: '500' }}>{anomaly.anomaly_type}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.9rem', color: 'var(--text-subtle)', maxWidth: '300px' }}>{anomaly.reason}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="dash-badge warning">{anomaly.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
