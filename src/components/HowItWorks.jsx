const steps = [
  {
    num: '01',
    title: 'Data Ingestion',
    desc: 'Pull records from any government system via CSV, REST API, or JSON. No schema changes required in source systems.',
    icon: '📥',
    color: '#7cff67',
  },
  {
    num: '02',
    title: 'Feature Engineering',
    desc: 'Names → FastText semantic embeddings. Addresses → libpostal parsing. Identifiers → structured normalization.',
    icon: '⚙️',
    color: '#9eeac7',
  },
  {
    num: '03',
    title: 'AI Matching Engine',
    desc: 'Siamese Neural Network computes similarity scores between record pairs. Threshold-based blocking ensures 100k records process in under 30 minutes.',
    icon: '🤖',
    color: '#B497CF',
  },
  {
    num: '04',
    title: 'Knowledge Graph Clustering',
    desc: 'Records become graph nodes. Similarity edges feed Louvain community detection to identify canonical business entities across departments.',
    icon: '🕸️',
    color: '#8a6fc9',
  },
  {
    num: '05',
    title: 'UBID Assignment',
    desc: 'Each entity cluster receives a permanent UBID — derived from PAN/GSTIN if available, otherwise cryptographic hash. Stored in the unified identity map.',
    icon: '🪪',
    color: '#5227FF',
  },
  {
    num: '06',
    title: 'Reviewer Dashboard',
    desc: 'Human reviewers validate AI decisions with full explanations and confidence scores. Feedback continuously retrains models for improving accuracy.',
    icon: '🧑‍💻',
    color: '#7c9fff',
  },
];

export default function HowItWorks() {
  return (
    <section className="section how-section" id="how-it-works">
      <div className="container">
        <div className="section-tag">How It Works</div>
        <h2 className="section-title">
          5-Layer Pipeline for<br />
          <span className="gradient-text">Perfect Identity Resolution</span>
        </h2>
        <p className="section-desc">
          From raw fragmented government data to a single authoritative UBID —
          the Infralink pipeline handles every stage with AI precision and
          human governance.
        </p>

        <div className="how-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>
          <div className="how-image-container" style={{ 
            position: 'relative', 
            borderRadius: '32px', 
            overflow: 'hidden', 
            border: '1px solid rgba(124, 255, 103, 0.25)',
            boxShadow: '0 20px 80px rgba(0, 0, 0, 0.5), 0 0 30px rgba(124, 255, 103, 0.15)',
            animation: 'float-slow 8s ease-in-out infinite'
          }}>
            <img 
              src="/pipeline.png" 
              alt="AI Intelligence Network" 
              style={{ width: '100%', height: 'auto', display: 'block', transition: 'transform 0.5s ease' }}
            />
            <div style={{ 
              position: 'absolute', 
              inset: 0, 
              background: 'linear-gradient(to bottom, transparent, rgba(6, 8, 16, 0.6))',
              pointerEvents: 'none'
            }} />
          </div>
          
          <div className="how-content">
            <div className="pipeline-layers" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                { title: 'Ingestion', desc: 'Zero-schema record extraction' },
                { title: 'Engineering', desc: 'Semantic semantic embeddings' },
                { title: 'Matching', desc: 'Siamese Neural Network scoring' },
                { title: 'Clustering', desc: 'Knowledge Graph Louvain detection' },
                { title: 'Finalization', desc: 'Permanent UBID assignment' }
              ].map((layer, i) => (
                <div key={i} className="layer-item" style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
                  <div className="layer-num" style={{ color: 'var(--green)', fontWeight: '800', fontSize: '1.2rem', fontFamily: 'Space Grotesk' }}>0{i+1}</div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>{layer.title}</h4>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{layer.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
