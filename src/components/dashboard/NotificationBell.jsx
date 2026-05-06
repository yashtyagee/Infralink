import React, { useState, useEffect, useRef } from 'react';
import { Bell, Info, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const ref = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications`);
      const data = await res.json();
      setNotifications(data || []);
      
      const countRes = await fetch(`${API_BASE}/notifications/unread-count`);
      const countData = await countRes.json();
      setUnreadCount(countData.count || 0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // poll every 10s
    
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const markAsRead = async (id) => {
    try {
      await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'POST' });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`${API_BASE}/notifications/read-all`, { method: 'POST' });
      fetchNotifications();
      setOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (severity) => {
    switch(severity) {
      case 'warning': return <AlertTriangle size={16} color="#f59e0b" />;
      case 'critical': return <XCircle size={16} color="#ef4444" />;
      default: return <Info size={16} color="#3b82f6" />;
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button 
        onClick={() => { setOpen(!open); if(!open) fetchNotifications(); }}
        style={{ 
          background: 'transparent', border: 'none', color: 'var(--text-color)', 
          cursor: 'pointer', position: 'relative', padding: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '4px', right: '4px',
            background: '#ef4444', color: 'white', fontSize: '0.65rem',
            fontWeight: 'bold', width: '16px', height: '16px',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: '0', marginTop: '12px',
          width: '380px', background: 'var(--bg-color)', border: '1px solid var(--border-color)',
          borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          zIndex: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column',
          color: 'var(--text-color)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <CheckCircle2 size={14} /> Mark all read
              </button>
            )}
          </div>
          
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.9rem' }}>
                No notifications
              </div>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} style={{ 
                  padding: '12px 16px', borderBottom: '1px solid var(--border-color)', 
                  background: notif.is_read ? 'transparent' : 'rgba(124, 255, 103, 0.05)',
                  display: 'flex', gap: '12px', alignItems: 'flex-start'
                }}>
                  <div style={{ marginTop: '2px' }}>{getIcon(notif.severity)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: notif.is_read ? 'normal' : '600', marginBottom: '4px', color: 'var(--text-color)' }}>{notif.type}</div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(240, 242, 255, 0.7)', marginBottom: '8px', lineHeight: 1.4 }}>{notif.message}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(notif.created_at).toLocaleString()}</div>
                  </div>
                  {!notif.is_read && (
                    <button 
                      onClick={() => markAsRead(notif.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '4px' }}
                      title="Mark as read"
                    >
                      <CheckCircle2 size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
