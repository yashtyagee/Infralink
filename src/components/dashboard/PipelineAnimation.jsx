import React from 'react';
import { motion } from 'framer-motion';
import { Database, GitMerge, Fingerprint, Activity } from 'lucide-react';

export default function PipelineAnimation() {
  return (
    <div style={{
      width: '100%', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '20px', margin: '20px 0', background: 'var(--bg2)', borderRadius: '12px', padding: '10px'
    }}>
      <Node icon={<Database size={24} />} label="Data Lakes" delay={0} />
      <Connector delay={0.2} />
      <Node icon={<GitMerge size={24} />} label="Resolution" delay={0.4} />
      <Connector delay={0.6} />
      <Node icon={<Activity size={24} />} label="Risk Engine" delay={0.8} />
      <Connector delay={1.0} />
      <Node icon={<Fingerprint size={24} color="#22c55e" />} label="Golden Record" delay={1.2} />
    </div>
  );
}

const Node = ({ icon, label, delay }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay, repeat: Infinity, repeatType: 'reverse', repeatDelay: 2 }}
    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
  >
    <div style={{ 
      width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)',
      boxShadow: '0 0 15px rgba(124, 255, 103, 0.1)'
    }}>
      {icon}
    </div>
    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</span>
  </motion.div>
);

const Connector = ({ delay }) => (
  <div style={{ width: '60px', height: '2px', background: 'rgba(255, 255, 255, 0.1)', position: 'relative', overflow: 'hidden' }}>
    <motion.div 
      initial={{ x: '-100%' }}
      animate={{ x: '100%' }}
      transition={{ duration: 1, delay, repeat: Infinity, ease: 'linear' }}
      style={{ width: '50%', height: '100%', background: 'var(--primary)', position: 'absolute', top: 0 }}
    />
  </div>
);
