import React, { useState } from 'react';
import { UserCheck, Check, X, Clock, BrainCircuit, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReviewerPanel() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attachToast, setAttachToast] = useState(null);

  const [orphanedEvents, setOrphanedEvents] = useState([]);
  const [targetUbids, setTargetUbids] = useState({});

  React.useEffect(() => {
    Promise.all([
      fetch('http://localhost:8000/api/review/pending').then(r => r.json()),
      fetch('http://localhost:8000/api/events/orphaned').then(r => r.json())
    ]).then(([reviewData, orphanedData]) => {
      setQueue((reviewData || []).filter(i => i && typeof i === 'object'));
      setOrphanedEvents((orphanedData || []).filter(i => i && typeof i === 'object'));
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const handleAttachEvent = async (eventId) => {
    const ubid = targetUbids[eventId];
    if (!ubid) return alert("Please enter a target UBID");
    
    try {
      const res = await fetch('http://localhost:8000/api/events/attach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, ubid })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to attach');

      // Remove from orphaned list
      setOrphanedEvents(events => events.filter(e => e.id !== eventId));

      // Show feedback toast
      setAttachToast({
        message: `✅ "${data.event_type}" attached to ${data.business_name || ubid}`,
        sub: `Analytics & Risk Intelligence updated · ${data.remaining_orphans} orphans remaining`
      });
      setTimeout(() => setAttachToast(null), 5000);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const [decisionToast, setDecisionToast] = useState(null);

  const handleAction = async (id, decision) => {
    const item = queue.find(q => q.id === id);
    try {
      const res = await fetch('http://localhost:8000/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          link_id: id,
          record_1_id: item?.record1?.id,
          record_2_id: item?.record2?.id,
          decision
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Review action failed');

      setQueue(q => q.filter(i => i.id !== id));

      // Show decision toast
      const toastColor = decision === 'APPROVE' ? '#22c55e'
                       : decision === 'REJECT'  ? '#ef4444'
                       : '#f59e0b';
      setDecisionToast({
        color: toastColor,
        decision,
        message: data.message,
        ubid: data.resultingProfile?.ubid || null,
        canonicalName: data.resultingProfile?.canonical_name || null
      });
      setTimeout(() => setDecisionToast(null), 6000);
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="dashboard-section"
    >
      {/* Attach Toast */}
      <AnimatePresence>
        {attachToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
              background: 'rgba(15, 30, 15, 0.95)', border: '1px solid rgba(124,255,103,0.4)',
              borderRadius: '14px', padding: '16px 20px', maxWidth: '380px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <CheckCircle2 size={18} color="#7cff67" />
              <span style={{ fontWeight: '700', color: '#7cff67', fontSize: '0.9rem' }}>Event Attached</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', marginLeft: '28px' }}>{attachToast.message}</div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginLeft: '28px', marginTop: '4px' }}>{attachToast.sub}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decision Toast */}
      <AnimatePresence>
        {decisionToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed', top: '80px', right: '20px', zIndex: 9999,
              background: 'rgba(10, 10, 20, 0.97)',
              border: `1px solid ${decisionToast.color}55`,
              borderRadius: '14px', padding: '16px 20px', maxWidth: '420px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <CheckCircle2 size={18} color={decisionToast.color} />
              <span style={{ fontWeight: '700', color: decisionToast.color, fontSize: '0.9rem' }}>
                {decisionToast.decision === 'APPROVE' ? 'Merge Approved'
                 : decisionToast.decision === 'REJECT' ? 'Merge Rejected'
                 : 'Decision Deferred'}
              </span>
            </div>
            <div style={{ fontSize: '0.84rem', color: 'rgba(255,255,255,0.8)', marginLeft: '28px', lineHeight: '1.5' }}>
              {decisionToast.message}
            </div>
            {decisionToast.ubid && (
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginLeft: '28px', marginTop: '6px', fontFamily: 'monospace' }}>
                Resulting UBID: {decisionToast.ubid}
                {decisionToast.canonicalName && ` · ${decisionToast.canonicalName}`}
              </div>
            )}
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', marginLeft: '28px', marginTop: '4px' }}>
              This decision is logged in the business profile audit trail.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="dash-card-header">
        <h2 className="dash-card-title">
          <UserCheck size={20} className="er-indigo" style={{ color: 'var(--indigo-light)' }} />
          Human-in-the-Loop Governance
        </h2>
        <span className="dash-badge">{queue.length} Pending Reviews</span>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
        Review edge cases where the AI model confidence falls between 80-95%. Your decisions directly retrain the EntityNet models.
      </p>

      <div className="review-queue">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading pending reviews...</div>
        ) : (
        <AnimatePresence>
          {queue.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}
            >
              <Check size={48} style={{ color: 'var(--green)', margin: '0 auto 16px', opacity: 0.5 }} />
              <h3>All caught up!</h3>
              <p>The review queue is empty.</p>
            </motion.div>
          )}

          {queue.map((item) => (
            <motion.div 
              key={item.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              className="review-item"
            >
              <div className="review-details">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                  <div className="er-score-circle" style={{ width: '60px', height: '60px', borderWidth: '1px' }}>
                    <div className="er-score-value" style={{ fontSize: '1.1rem' }}>
                      {((item.similarity_score || 0) * 100).toFixed(0)}
                      <span style={{fontSize: '0.6rem'}}>%</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Candidate Entities</div>
                    <div style={{ fontWeight: '600' }}>
                      {item.record1?.source_department || 'Unknown'}: "{item.record1?.name || 'Unnamed'}"
                    </div>
                    <div style={{ fontWeight: '600', color: 'var(--text-muted)' }}>
                      {item.record2?.source_department || 'Unknown'}: "{item.record2?.name || 'Unnamed'}"
                    </div>
                  </div>
                </div>
                <div className="review-reason">
                  <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', color: '#fff' }}>
                    <BrainCircuit size={14} /> AI Reasoning
                  </strong>
                  Matched fields: {Array.isArray(item.matched_fields) ? item.matched_fields.join(', ') : 'None'}. 
                  Score indicates high probability but requires human confirmation.
                </div>
              </div>

              <div className="review-actions">
                <button 
                  onClick={() => handleAction(item.id, 'APPROVE')}
                  className="btn btn--sm" 
                  style={{ background: 'rgba(124, 255, 103, 0.1)', color: 'var(--green)', border: '1px solid rgba(124, 255, 103, 0.3)' }}
                >
                  <Check size={14} /> Confirm Merge
                </button>
                <button 
                  onClick={() => handleAction(item.id, 'REJECT')}
                  className="btn btn--sm" 
                  style={{ background: 'rgba(255, 100, 100, 0.1)', color: '#ff6b6b', border: '1px solid rgba(255, 100, 100, 0.3)' }}
                >
                  <X size={14} /> Reject Merge
                </button>
                <button 
                  onClick={() => handleAction(item.id, 'DEFER')}
                  className="btn btn--ghost btn--sm"
                >
                  <Clock size={14} /> Defer Decision
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        )}
      </div>

      <div className="dash-card-header" style={{ marginTop: '48px' }}>
        <h2 className="dash-card-title">
          <Clock size={20} className="er-warning" style={{ color: 'var(--yellow)' }} />
          Orphaned Events Queue
        </h2>
        <span className="dash-badge warning">{orphanedEvents.length} Pending Attachments</span>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
        Activity events that could not be automatically joined to a UBID. Manually review and attach them to the correct Canonical Profile.
      </p>

      <div className="review-queue">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading orphaned events...</div>
        ) : (
          <AnimatePresence>
            {orphanedEvents.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}
              >
                <Check size={48} style={{ color: 'var(--green)', margin: '0 auto 16px', opacity: 0.5 }} />
                <h3>No Orphaned Events</h3>
                <p>All activity signals are confidently linked.</p>
              </motion.div>
            )}
            
            {orphanedEvents.map((event) => (
              <motion.div 
                key={event.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                className="review-item"
              >
                <div className="review-details">
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Source: {event.source_department || 'Unknown'}</div>
                    <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{(event.event_type || 'Event')} - {event.business_name || 'Generic Business'}</div>
                    <div style={{ color: 'var(--text-muted)' }}>Date: {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'Unknown Date'}</div>
                  </div>
                  <div className="review-reason">
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', color: '#fff' }}>
                      <BrainCircuit size={14} /> Description
                    </strong>
                    {event.description}
                  </div>
                </div>

                <div className="review-actions" style={{ flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <input 
                    type="text" 
                    placeholder="Enter Target UBID..."
                    className="search-input"
                    style={{ width: '200px', padding: '8px', marginBottom: '8px' }}
                    value={targetUbids[event.id] || ''}
                    onChange={(e) => setTargetUbids({...targetUbids, [event.id]: e.target.value})}
                  />
                  <button 
                    onClick={() => handleAttachEvent(event.id)}
                    className="btn btn--sm" 
                    style={{ width: '200px', background: 'rgba(124, 255, 103, 0.1)', color: 'var(--green)', border: '1px solid rgba(124, 255, 103, 0.3)' }}
                  >
                    <Check size={14} /> Force Attach
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

    </motion.div>
  );
}
