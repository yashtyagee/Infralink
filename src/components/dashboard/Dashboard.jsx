import React, { useState } from 'react';
import { LayoutDashboard, Network, UserCheck, Fingerprint, ArrowLeft, AlertTriangle } from 'lucide-react';
import Aurora from '../Aurora';
import EntityResolution from './EntityResolution';
import GraphVisualization from './GraphVisualization';
import UBIDProfile from './UBIDProfile';
import ReviewerPanel from './ReviewerPanel';
import AnalyticsPanel from './AnalyticsPanel';
import RiskIntelligence from './RiskIntelligence';
import NotificationBell from './NotificationBell';
import ExportMenu from './ExportMenu';
import LanguageToggle from '../LanguageToggle';
import ThemeToggle from '../ThemeToggle';
import PipelineAnimation from './PipelineAnimation';
import { useLanguage } from '../../contexts/LanguageContext';
import './Dashboard.css';

const API_BASE = 'http://localhost:8000/api';

export default function Dashboard({ onBack }) {
  const [activeTab, setActiveTab] = useState('entity');
  const [isProcessing, setIsProcessing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { t } = useLanguage();

  const runPipeline = async () => {
    setIsProcessing(true);
    try {
      await fetch(`${API_BASE}/match`, { method: 'POST' });
      await fetch(`${API_BASE}/cluster`, { method: 'POST' });
      // Force children to re-fetch by triggering a re-render
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error("Pipeline failed", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'entity': return <EntityResolution key={`entity-${refreshKey}`} />;
      case 'graph': return <GraphVisualization key={`graph-${refreshKey}`} />;
      case 'profile': return <UBIDProfile key={`profile-${refreshKey}`} />;
      case 'reviewer': return <ReviewerPanel key={`reviewer-${refreshKey}`} />;
      case 'analytics': return <AnalyticsPanel key={`analytics-${refreshKey}`} />;
      case 'risk': return <RiskIntelligence key={`risk-${refreshKey}`} />;
      default: return <EntityResolution key={`default-${refreshKey}`} />;
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand" onClick={onBack}>
          <span className="dashboard-brand-icon">⬡</span>
          <span>Infralink</span>
        </div>
        
        <nav className="dashboard-nav">
          <button 
            className={`dashboard-nav-item ${activeTab === 'entity' ? 'active' : ''}`}
            onClick={() => setActiveTab('entity')}
          >
            <LayoutDashboard size={18} /> {t('Entity Resolution')}
          </button>
          <button 
            className={`dashboard-nav-item ${activeTab === 'graph' ? 'active' : ''}`}
            onClick={() => setActiveTab('graph')}
          >
            <Network size={18} /> {t('Knowledge Graph')}
          </button>
          <button 
            className={`dashboard-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <Fingerprint size={18} /> {t('UBID Profile')}
          </button>
          <button 
            className={`dashboard-nav-item ${activeTab === 'reviewer' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviewer')}
          >
            <UserCheck size={18} /> {t('Reviewer Panel')}
          </button>
          <button 
            className={`dashboard-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <Network size={18} /> {t('Analytics')}
          </button>
          <button 
            className={`dashboard-nav-item ${activeTab === 'risk' ? 'active' : ''}`}
            onClick={() => setActiveTab('risk')}
          >
            <AlertTriangle size={18} /> Risk Intelligence
          </button>
        </nav>

        <div style={{ padding: '0 16px', marginTop: 'auto' }}>
          <button 
            className="dashboard-nav-item"
            onClick={onBack}
            style={{ color: 'var(--text-subtle)' }}
          >
            <ArrowLeft size={18} /> Exit Platform
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Background Effect for Dashboard */}
        <div className="dashboard-aurora-wrapper">
          <Aurora 
            colorStops={["#7cff67", "#B497CF", "#5227FF"]}
            blend={0.5} amplitude={0.5} speed={0.4}
          />
        </div>

        {/* Topbar */}
        <header className="dashboard-topbar">
          <h1 style={{ fontFamily: 'Space Grotesk' }}>
            {activeTab === 'entity' && 'AI Entity Resolution Engine'}
            {activeTab === 'graph' && 'Global Knowledge Graph'}
            {activeTab === 'profile' && 'Unified Business Intelligence'}
            {activeTab === 'reviewer' && 'Governance & Review Queue'}
            {activeTab === 'analytics' && 'Advanced Analytics & Queries'}
            {activeTab === 'risk' && 'Risk Intelligence & Fraud Detection'}
          </h1>
          <div className="dashboard-topbar-actions">
            <ThemeToggle />
            <LanguageToggle />
            <button 
              onClick={runPipeline} 
              disabled={isProcessing}
              className="btn btn--primary btn--sm" 
              style={{ padding: '6px 16px', fontSize: '0.8rem' }}
            >
              {isProcessing ? 'Processing...' : 'Run AI Pipeline'}
            </button>
            <ExportMenu />
            <div className="status-indicator">
              <span className="status-dot"></span>
              System Online
            </div>
            <NotificationBell />
          </div>
        </header>

        {isProcessing && <PipelineAnimation />}

        {/* Scrollable Content Area */}
        <div className="dashboard-content">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}