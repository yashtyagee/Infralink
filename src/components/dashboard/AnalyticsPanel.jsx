import React from 'react';
import { Search, Filter, AlertCircle, Building, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AnalyticsPanel() {
  const [results, setResults] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [searched, setSearched] = React.useState(false);

  // Form State
  const [status, setStatus] = React.useState('ACTIVE');
  const [pincode, setPincode] = React.useState('560001');
  const [missingEventType, setMissingEventType] = React.useState('Inspection');
  const [missingMonths, setMissingMonths] = React.useState('18');

  const runQuery = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const response = await fetch('http://localhost:8000/api/analytics/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          pincode,
          missing_event_type: missingEventType,
          missing_event_months: parseInt(missingMonths)
        })
      });
      const data = await response.json();
      setResults(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="dashboard-section"
      style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}
    >
      <div className="ubid-header">
        <div>
          <h2 className="dash-card-title" style={{ fontSize: '1.75rem', marginBottom: '8px', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '10px', background: 'rgba(124, 255, 103, 0.1)', borderRadius: '14px', display: 'flex', boxShadow: '0 0 20px rgba(124, 255, 103, 0.1)' }}>
              <Search size={32} style={{ color: 'var(--green)' }} />
            </div>
            Advanced Analytics Query
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginLeft: '66px' }}>Cross-department filtering to identify compliance gaps and operational risks.</p>
        </div>
      </div>

      <div className="dash-card glass-panel" style={{ padding: '32px', border: '1px solid var(--border2)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <h3 className="dash-card-title" style={{ marginBottom: '28px', fontSize: '1.2rem' }}>
          <Filter size={20} style={{ color: 'var(--purple)' }} />
          Query Parameters
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label className="er-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
              <Building size={14} /> Target Business Status
            </label>
            <select 
              className="search-input" 
              style={{ width: '100%', height: '46px' }}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="ACTIVE">Active Businesses</option>
              <option value="DORMANT">Dormant Businesses</option>
              <option value="CLOSED">Closed Businesses</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label className="er-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
              <Search size={14} /> Target Pincode (Area)
            </label>
            <input 
              type="text" 
              className="search-input" 
              style={{ width: '100%', height: '46px' }} 
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="e.g. 560058"
            />
          </div>

          <div style={{ 
            gridColumn: '1 / -1', 
            padding: '24px', 
            background: 'rgba(255, 59, 48, 0.03)', 
            border: '1px solid rgba(255, 59, 48, 0.1)', 
            borderRadius: '16px',
            position: 'relative'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#ff3b30' }} />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', color: '#ff3b30', fontWeight: '700', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <AlertCircle size={20} />
              Missing Compliance Event Filter
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label className="er-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={14} /> Event Type Missing
                </label>
                <select 
                  className="search-input" 
                  style={{ width: '100%', height: '46px' }}
                  value={missingEventType}
                  onChange={(e) => setMissingEventType(e.target.value)}
                >
                  <option value="Inspection">Safety Inspection</option>
                  <option value="Renewal">License Renewal</option>
                  <option value="Filing">Tax Filing (GSTR-3B)</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label className="er-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={14} /> Timeframe (Months)
                </label>
                <input 
                  type="number" 
                  className="search-input" 
                  style={{ width: '100%', height: '46px' }} 
                  value={missingMonths}
                  onChange={(e) => setMissingMonths(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <button className="primary-btn" onClick={runQuery} disabled={loading} style={{ width: '100%', height: '52px', fontSize: '1.1rem', marginTop: '8px' }}>
          {loading ? 'Running Complex Query...' : 'Execute Intelligence Query'}
        </button>
      </div>

      {searched && (
        <div className="dash-card glass-panel" style={{ padding: '32px', border: '1px solid var(--border2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h3 className="dash-card-title" style={{ fontSize: '1.2rem' }}>
              <Building size={20} style={{ color: 'var(--green)' }} />
              Query Results
            </h3>
            <span className="dash-badge" style={{ padding: '6px 14px', fontSize: '0.85rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}>
              {results.length} Entities Found
            </span>
          </div>
          
          {results.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '60px', background: 'rgba(0,0,0,0.1)', borderRadius: '16px' }}>
              <Search size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
              <p style={{ fontSize: '1.1rem' }}>No businesses match these exact criteria.</p>
              <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>Try removing the pincode filter or changing the status.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {results.map((ubidProfile) => (
                <div key={ubidProfile.ubid} style={{ 
                  padding: '20px 24px', 
                  background: 'rgba(255,255,255,0.02)', 
                  borderRadius: '16px', 
                  border: '1px solid var(--border)', 
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }} className="result-item-hover">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text)' }}>{ubidProfile.canonical_name || ubidProfile.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--green)', fontFamily: 'monospace', marginTop: '4px' }}>{ubidProfile.ubid}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      {ubidProfile.missing_compliance_events > 0 && (
                        <div className="dash-badge warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 10px', fontSize: '0.75rem' }}>
                          <AlertCircle size={12} />
                          Missing {missingEventType}
                        </div>
                      )}
                      <div className="dash-badge" style={{ padding: '5px 10px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.04)' }}>
                        {ubidProfile.event_count} events recorded
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <div>📍 {ubidProfile.canonical_address || 'Address not on record'}</div>
                    <div>📁 {ubidProfile.record_count} records · Risk: {Math.round(ubidProfile.risk_score || 0)}%</div>
                    {ubidProfile.source_departments && ubidProfile.source_departments.length > 0 && (
                      <div style={{ gridColumn: '1/-1' }}>
                        🏛️ Registered in: {ubidProfile.source_departments.join(' · ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </motion.div>
  );
}

