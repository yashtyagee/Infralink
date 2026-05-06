const layers = [
  { label: 'Government Databases', sub: 'GST · Labour · Industry · Municipal', icon: '🏛️', color: '#7cff67' },
  { label: 'Data Ingestion Layer', sub: 'CSV / REST API / JSON connectors', icon: '📥', color: '#9eeac7' },
  { label: 'Feature Engineering', sub: 'Embeddings · Parsing · Phonetics', icon: '⚙️', color: '#B497CF' },
  { label: 'AI Matching Engine', sub: 'Siamese Neural Network · PyTorch', icon: '🤖', color: '#8a6fc9' },
  { label: 'Knowledge Graph', sub: 'Neo4j · Louvain Clustering Algorithm', icon: '🕸️', color: '#5227FF' },
  { label: 'UBID Assignment', sub: 'Unified Identity Map', icon: '🪪', color: '#7c9fff' },
  { label: 'Reviewer Dashboard', sub: 'Explainable AI · Human Governance', icon: '🧑‍💻', color: '#ffffff' },
];

const stack = [
  { layer: 'Backend', tech: 'Python + FastAPI' },
  { layer: 'Machine Learning', tech: 'PyTorch' },
  { layer: 'Graph Intelligence', tech: 'Neo4j' },
  { layer: 'Data Processing', tech: 'Pandas' },
  { layer: 'Address Parsing', tech: 'libpostal' },
  { layer: 'Embeddings', tech: 'FastText' },
  { layer: 'Frontend', tech: 'React.js' },
  { layer: 'Deployment', tech: 'Docker' },
];

export default function Architecture() {
  return (
    <section className="section arch-section" id="architecture">
      <div className="container">
        <div className="section-tag">System Architecture</div>
        <h2 className="section-title">
          A 5-Layer Stack Built for<br />
          <span className="gradient-text">Government Scale</span>
        </h2>
        <p className="section-desc">
          Zero System Modification Architecture — Infralink works as an overlay intelligence
          layer. Existing department databases remain completely untouched.
        </p>

        <div className="arch-layout">
          {/* Pipeline visual */}
          <div className="arch-pipeline">
            {layers.map((l, i) => (
              <div key={l.label} className="arch-layer" style={{ '--accent': l.color }}>
                <div className="arch-layer__icon">{l.icon}</div>
                <div className="arch-layer__body">
                  <div className="arch-layer__label">{l.label}</div>
                  <div className="arch-layer__sub">{l.sub}</div>
                </div>
                {i < layers.length - 1 && (
                  <div className="arch-layer__arrow">↓</div>
                )}
              </div>
            ))}
          </div>

          {/* Tech stack table */}
          <div className="arch-stack">
            <h3 className="arch-stack__title">Technology Stack</h3>
            <div className="stack-table">
              {stack.map(s => (
                <div className="stack-row" key={s.layer}>
                  <span className="stack-row__layer">{s.layer}</span>
                  <span className="stack-row__tech">{s.tech}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
