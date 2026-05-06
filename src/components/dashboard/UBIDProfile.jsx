import React, { useState, useEffect } from 'react';
import { Fingerprint, Building2, Activity, ShieldCheck, MapPin, Building, Clock, Info, CheckCircle2, AlertTriangle, Search, X, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API = 'http://localhost:8000';

export default function UBIDProfile() {
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [sources, setSources] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reclusterLoading, setReclusterLoading] = useState(false);
  const [reclusterResult, setReclusterResult] = useState(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Load a specific UBID profile
  const loadProfile = (ubid) => {
    setLoading(true);
    setShowDropdown(false);
    
    // Use the full profile endpoint if available, otherwise fetch individually
    fetch(`${API}/api/ubid/${ubid}/profile`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load profile');
        return res.json();
      })
      .then(data => {
        setProfile(data.profile);
        setSources(data.records || []);
        setEvents(data.events || []);
        setAuditLogs(data.audit_trail || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Profile endpoint failed, falling back to individual endpoints", err);
        // Fallback to old behavior
        fetch(`${API}/api/ubid`)
          .then(res => res.json())
          .then(data => {
            const foundProfile = data.find(p => p.ubid === ubid);
            if (!foundProfile) throw new Error('UBID not found');
            setProfile(foundProfile);
            return Promise.all([
              fetch(`${API}/api/ubid/${ubid}/events`).then(r => r.json()),
              fetch(`${API}/api/ubid/${ubid}/sources`).then(r => r.json()),
              fetch(`${API}/api/audit/${ubid}`).then(r => r.json())
            ]);
          })
          .then(([eventData, sourceData, auditData]) => {
            setEvents(eventData || []);
            // Check if sourceData has records array (new format) or is array itself (old format)
            setSources(sourceData.records || sourceData || []);
            setAuditLogs(auditData || []);
            setLoading(false);
          })
          .catch(e => {
            console.error(e);
            setLoading(false);
          });
      });
  };

  // Initial load
  useEffect(() => {
    fetch(`${API}/api/ubid`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          loadProfile(data[0].ubid);
        } else {
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Handle Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        fetch(`${API}/api/ubid/search?q=${encodeURIComponent(searchQuery)}`)
          .then(res => res.json())
          .then(data => {
            setSearchResults(data.results || []);
            setIsSearching(false);
            setShowDropdown(true);
          })
          .catch(err => {
            console.error("Search failed:", err);
            setSearchResults([]);
            setIsSearching(false);
          });
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const runReCluster = async () => {
    setReclusterLoading(true);
    setReclusterResult(null);
    try {
      const res = await fetch(`${API}/api/cluster/re-run`, { method: 'POST' });
      const data = await res.json();
      setReclusterResult(data);
      // Reload the current profile list after re-clustering
      setLoading(true);
      fetch(`${API}/api/ubid`)
        .then(r => r.json())
        .then(list => {
          if (list && list.length > 0) loadProfile(list[0].ubid);
          else setLoading(false);
        });
    } catch (err) {
      setReclusterResult({ error: err.message });
    }
    setReclusterLoading(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="dashboard-section"
    >
      {/* --- Re-cluster Banner --- */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(255,159,67,0.06)', border: '1px solid rgba(255,159,67,0.2)',
        borderRadius: '12px', padding: '12px 20px', marginBottom: '20px', gap: '16px'
      }}>
        <div>
          <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#ff9f43' }}>⚠️ Duplicate UBIDs?</div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
            If you see the same business with multiple UBIDs, run deduplication to merge them.
          </div>
        </div>
        <button
          onClick={runReCluster}
          disabled={reclusterLoading}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: reclusterLoading ? 'rgba(255,159,67,0.1)' : 'rgba(255,159,67,0.15)',
            border: '1px solid rgba(255,159,67,0.4)', color: '#ff9f43',
            borderRadius: '10px', padding: '10px 18px', cursor: reclusterLoading ? 'not-allowed' : 'pointer',
            fontFamily: 'Space Grotesk', fontWeight: '600', fontSize: '0.85rem',
            whiteSpace: 'nowrap', transition: 'all 0.2s'
          }}
        >
          <RefreshCw size={16} style={{ animation: reclusterLoading ? 'spin 1s linear infinite' : 'none' }} />
          {reclusterLoading ? 'Re-clustering...' : 'Re-Run Deduplication'}
        </button>
      </div>

      {/* Re-cluster Result */}
      {reclusterResult && (
        <div style={{
          background: reclusterResult.error ? 'rgba(239,68,68,0.08)' : 'rgba(124,255,103,0.08)',
          border: `1px solid ${reclusterResult.error ? 'rgba(239,68,68,0.3)' : 'rgba(124,255,103,0.3)'}`,
          borderRadius: '12px', padding: '14px 20px', marginBottom: '20px', fontSize: '0.85rem'
        }}>
          {reclusterResult.error
            ? `❌ Error: ${reclusterResult.error}`
            : `✅ ${reclusterResult.message} — Auto-merged: ${reclusterResult.matching?.autoMerged || 0}, Pending: ${reclusterResult.matching?.pendingReview || 0}`
          }
        </div>
      )}
      <div style={{ position: 'relative', marginBottom: '32px', zIndex: 100 }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg2)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '4px 16px',
          boxShadow: showDropdown ? '0 8px 32px rgba(0,0,0,0.4)' : 'none',
          transition: 'all 0.2s'
        }}>
          <Search size={20} color="var(--text-muted)" style={{ marginRight: '12px' }} />
          <input 
            type="text" 
            placeholder="Search UBID profiles by business name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if(searchQuery.length >= 2) setShowDropdown(true); }}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              padding: '12px 0',
              color: 'var(--text-primary)',
              fontSize: '1rem',
              outline: 'none',
              width: '100%'
            }}
          />
          {isSearching && <Loader2 size={20} className="spinner" style={{ color: 'var(--green)', marginLeft: '12px' }} />}
          {searchQuery && !isSearching && (
            <X 
              size={20} 
              color="var(--text-muted)" 
              style={{ marginLeft: '12px', cursor: 'pointer' }} 
              onClick={() => { setSearchQuery(''); setShowDropdown(false); }}
            />
          )}
        </div>

        {/* Dropdown Results */}
        <AnimatePresence>
          {showDropdown && searchResults.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '8px',
                background: 'var(--bg2)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
                maxHeight: '400px',
                overflowY: 'auto',
                padding: '8px'
              }}
            >
              {searchResults.map(res => (
                <div 
                  key={res.ubid}
                  onClick={() => loadProfile(res.ubid)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{res.canonical_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      UBID: {res.ubid} • Anchor: {res.anchor_type} ({res.anchor_value})
                    </div>
                  </div>
                  <div className="dash-badge success" style={{ fontSize: '0.75rem' }}>{res.status}</div>
                </div>
              ))}
            </motion.div>
          )}
          {showDropdown && searchResults.length === 0 && !isSearching && searchQuery.length >= 2 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px',
                background: 'var(--bg2)', border: '1px solid var(--border-color)', borderRadius: '12px',
                padding: '24px', textAlign: 'center', color: 'var(--text-muted)'
              }}
            >
              No matching businesses found.
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {loading ? (
        <div style={{ padding: '40px', color: 'var(--text-muted)', textAlign: 'center' }}>
          <Loader2 size={32} className="spinner" style={{ margin: '0 auto 16px', color: 'var(--green)' }} />
          Loading Unified Profile...
        </div>
      ) : !profile ? (
        <div style={{ padding: '40px', color: 'var(--text-muted)', textAlign: 'center' }}>
          No UBID profiles found. Search or run AI Pipeline.
        </div>
      ) : (
        <>
          <div className="ubid-header">
            <div>
              <h2 className="dash-card-title" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>
                <Fingerprint size={28} className="er-green" style={{ color: 'var(--green)' }} />
                Unified Business Profile
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>The canonical "Golden Record" assigned to this business entity.</p>
            </div>
            <div className="ubid-id-display">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>UBID</span>
              <span className="ubid-id-text">{profile.ubid}</span>
            </div>
          </div>

          <div className="er-grid" style={{ gridTemplateColumns: '1.5fr 1fr', alignItems: 'start', marginBottom: '32px' }}>
            {/* Core Attributes */}
            <div className="dash-card">
              <h3 className="dash-card-title" style={{ marginBottom: '24px' }}>
                <Building2 size={18} />
                Canonical Attributes
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <div className="er-label">Unified Legal Name</div>
                  <div className="er-value" style={{ fontSize: '1.1rem', fontWeight: '600' }}>{profile.canonical_name}</div>
                </div>
                <div>
                  <div className="er-label">Primary Status</div>
                  <div className="dash-badge success" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Activity size={12} />
                    {profile.status}
                  </div>
                </div>
                <div>
                  <div className="er-label">Anchor Identifier</div>
                  <div className="er-value" style={{ color: 'var(--green)' }}>{profile.anchor_type}: {profile.anchor_value}</div>
                </div>
                <div>
                  <div className="er-label">Risk Category</div>
                  <div className="dash-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={12} />
                    {profile.risk_score > 70 ? 'HIGH RISK' : profile.risk_score > 30 ? 'MEDIUM RISK' : 'LOW RISK'}
                  </div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div className="er-label">Unified Registered Address</div>
                  <div className="er-value" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-muted)' }}>
                    <MapPin size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                    {profile.canonical_address || 'Address matched via underlying records'}
                  </div>
                </div>
              </div>
            </div>

            {/* Linked Identities / Sources */}
            <div className="dash-card">
              <h3 className="dash-card-title" style={{ marginBottom: '24px' }}>
                <Building size={18} />
                Department Registrations
                <span style={{ marginLeft: '8px', fontSize: '0.75rem', fontWeight: '400', color: 'var(--text-muted)' }}>
                  ({sources.length} record{sources.length !== 1 ? 's' : ''} across{' '}
                  {[...new Set(sources.map(s => s.source_department))].length} dept{[...new Set(sources.map(s => s.source_department))].length !== 1 ? 's' : ''})
                </span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '320px', overflowY: 'auto' }}>
                {sources.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)' }}>No source records linked.</div>
                ) : (
                  // Group by department
                  Object.entries(
                    sources.reduce((acc, src) => {
                      const dept = src.source_department || 'Unknown';
                      if (!acc[dept]) acc[dept] = [];
                      acc[dept].push(src);
                      return acc;
                    }, {})
                  ).map(([dept, deptRecords]) => (
                    <div key={dept} style={{
                      background: 'var(--bg-dark, rgba(0,0,0,0.2))',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                          🏛️ {dept}
                        </div>
                        <span className="dash-badge success" style={{ fontSize: '0.7rem' }}>
                          {deptRecords.length} record{deptRecords.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {deptRecords.map((src, idx) => (
                        <div key={src.id} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                          paddingTop: idx > 0 ? '8px' : 0,
                          borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                          gap: '12px'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Name: {src.name}</div>
                            {src.address && <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '2px' }}>📍 {src.address}</div>}
                          </div>
                          {src.pan && <span style={{ fontSize: '0.7rem', color: 'var(--green)', fontFamily: 'monospace' }}>PAN: {src.pan}</span>}
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>


          {/* Cross-Department Activity Timeline */}
          <div className="dash-card">
            <h3 className="dash-card-title" style={{ marginBottom: '24px' }}>
              <Activity size={18} />
              Cross-Department Activity Intelligence
            </h3>
            <div className="ubid-timeline">
              {events.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No activity events recorded.</div>
              ) : (
                events.map((ev, index) => (
                  <div className="timeline-event" key={ev.id || index} style={{ paddingBottom: index === events.length - 1 ? 0 : undefined }}>
                    <div className="timeline-date">{new Date(ev.event_date).toLocaleDateString()} • {ev.department || ev.source_department} ({ev.event_type})</div>
                    <div className="timeline-content">{ev.description}</div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* System Audit Trail */}
          <div className="dash-card" style={{ marginTop: '32px' }}>
            <h3 className="dash-card-title" style={{ marginBottom: '24px' }}>
              <Clock size={18} />
              System Audit Trail & Timeline
            </h3>
            <div style={{ position: 'relative', paddingLeft: '24px', borderLeft: '2px solid var(--border-color)', marginLeft: '12px' }}>
              {auditLogs.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No audit logs recorded yet.</div>
              ) : (
                auditLogs.map((log, index) => {
                  const action = log.action || '';
                  const details = log.details || {};

                  // Determine icon + color + label per action type
                  let icon = <Info size={16} color="#3b82f6" />;
                  let labelColor = '#3b82f6';
                  let label = action;
                  let description = details.message || JSON.stringify(details);

                  if (action === 'HUMAN_REVIEW_MERGE') {
                    icon = <CheckCircle2 size={16} color="#22c55e" />;
                    labelColor = '#22c55e';
                    label = '✅ Merge Approved';
                    description = `"${details.name_1}" (${details.dept_1}) merged with "${details.name_2}" (${details.dept_2}) — Score: ${Math.round((details.similarity_score || 0) * 100)}%`;
                  } else if (action === 'HUMAN_REVIEW_REJECTED') {
                    icon = <AlertTriangle size={16} color="#ef4444" />;
                    labelColor = '#ef4444';
                    label = '❌ Merge Rejected';
                    description = `Reviewer rejected merging with "${details.linked_record_name}" (${details.linked_record_dept}) — entities kept separate`;
                  } else if (action === 'EVENT_ATTACHED') {
                    icon = <CheckCircle2 size={16} color="#6366f1" />;
                    labelColor = '#6366f1';
                    label = `📎 Activity Event Attached`;
                    description = `"${details.event_type}" from ${details.department} manually linked to this profile${details.event_date ? ` (${new Date(details.event_date).toLocaleDateString()})` : ''}`;
                  } else if (action.startsWith('ANOMALY_DETECTED')) {
                    icon = <AlertTriangle size={16} color="#f59e0b" />;
                    labelColor = '#f59e0b';
                    label = `⚠️ ${(details.type || 'Anomaly')} Detected`;
                    description = details.details || details.message || 'Risk flag raised by AI scanner';
                  } else if (action.includes('UBID_ASSIGNED') || action.includes('Assigned')) {
                    icon = <CheckCircle2 size={16} color="#22c55e" />;
                    labelColor = '#22c55e';
                    label = '🆔 UBID Assigned';
                  }

                  return (
                    <div key={log.id || index} style={{ position: 'relative', marginBottom: index === auditLogs.length - 1 ? 0 : '24px' }}>
                      <div style={{ position: 'absolute', left: '-33px', top: '2px', background: 'var(--bg-color)', borderRadius: '50%' }}>
                        {icon}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        {new Date(log.created_at || log.timestamp).toLocaleString()} · {log.actor || 'SYSTEM'}
                      </div>
                      <div style={{ fontSize: '0.88rem', fontWeight: '700', marginBottom: '4px', color: labelColor }}>{label}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', lineHeight: '1.5' }}>{description}</div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </>
      )}
    </motion.div>
  );
}
