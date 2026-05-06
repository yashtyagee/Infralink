import React from 'react';

const features = [
  {
    icon: '🧬',
    title: 'AI Entity Resolution',
    desc: 'Deep learning Siamese Neural Networks detect duplicate records across departments with >90% precision using semantic embeddings, phonetic matching, and address normalization.',
    tag: 'Core Engine',
    color: '#7cff67',
  },
  {
    icon: '🕸️',
    title: 'Knowledge Graph Intelligence',
    desc: 'All business records live in a Neo4j graph. Louvain clustering algorithms automatically group records into canonical entities, handling transitive similarity at scale.',
    tag: 'Graph Layer',
    color: '#B497CF',
  },
  {
    icon: '🪪',
    title: 'UBID Assignment',
    desc: 'Every resolved entity receives a permanent Unique Business Identifier. Derived from PAN/GSTIN anchors or cryptographic hash — auditable, traceable, and reversible.',
    tag: 'Identity',
    color: '#5227FF',
  },
  {
    icon: '📈',
    title: 'Business Activity Intelligence',
    desc: 'Cox Proportional Hazards survival analysis predicts whether a business is Active, Dormant, or Closed using filing frequency, transaction dates, and regulatory signals.',
    tag: 'Lifecycle AI',
    color: '#7cff67',
  },
  {
    icon: '🧑‍⚖️',
    title: 'Human-in-the-Loop Review',
    desc: 'Reviewers see entity comparisons, confidence scores, and explanations. Confirm, Reject, or Defer — every decision feeds back into continuous model improvement.',
    tag: 'Governance',
    color: '#B497CF',
  },
  {
    icon: '🔎',
    title: 'Explainable AI Governance',
    desc: 'Every merge decision carries a full audit trail — probability score, feature breakdown, and decision history. Critical for government trust and regulatory compliance.',
    tag: 'XAI',
    color: '#5227FF',
  },
];

export default function Features() {
  return (
    <section className="section features-section" id="features">
      <div className="container">
        <div className="section-tag">Platform Capabilities</div>
        <h2 className="section-title">
          Six Pillars of<br />
          <span className="gradient-text">Unified Intelligence</span>
        </h2>
        <p className="section-desc">
          Infralink combines state-of-the-art machine learning, graph databases,
          and explainable AI into a single overlay platform — zero modification
          to existing government systems required.
        </p>

        <div className="features-grid">
          {features.map((f) => (
            <div className="feature-card" key={f.title} style={{ '--accent': f.color }}>
              <div className="feature-card__top">
                <div className="feature-card__icon">{f.icon}</div>
                <span className="feature-card__tag">{f.tag}</span>
              </div>
              <h3 className="feature-card__title">{f.title}</h3>
              <p className="feature-card__desc">{f.desc}</p>
              <div className="feature-card__glow" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
