const metrics = [
  { value: '>90%', label: 'Entity Resolution Precision', icon: '🎯' },
  { value: '>85%', label: 'Entity Resolution Recall', icon: '📡' },
  { value: '>80%', label: 'Activity Prediction Accuracy', icon: '📊' },
  { value: '<30min', label: '100k Records Processed', icon: '⚡' },
  { value: '>95%', label: 'Reviewer Completion Rate', icon: '✅' },
  { value: '40+', label: 'Government Departments', icon: '🏛️' },
];

const roadmap = [
  {
    phase: 'Phase 1',
    title: 'Hackathon Prototype',
    timeline: '5 Days',
    items: ['Synthetic dataset', 'AI matching model', 'Knowledge graph clustering', 'UBID generation', 'Reviewer dashboard'],
    status: 'active',
  },
  {
    phase: 'Phase 2',
    title: 'Production Prototype',
    timeline: '3 Months',
    items: ['Secure APIs', 'Department connectors', 'Scalable graph infrastructure', 'Role-based access control'],
    status: 'upcoming',
  },
  {
    phase: 'Phase 3',
    title: 'Full Deployment',
    timeline: '12 Months',
    items: ['40+ departments', 'Millions of businesses', 'Analytics dashboards', 'National UBID network'],
    status: 'future',
  },
];

export default function Impact() {
  return (
    <section className="section impact-section" id="impact">
      <div className="container">
        <div className="section-tag">Success Metrics</div>
        <h2 className="section-title">
          Built to Perform at<br />
          <span className="gradient-text">Government Scale</span>
        </h2>

        <div className="metrics-grid">
          {metrics.map(m => (
            <div className="metric-card" key={m.label}>
              <div className="metric-card__icon">{m.icon}</div>
              <div className="metric-card__value">{m.value}</div>
              <div className="metric-card__label">{m.label}</div>
            </div>
          ))}
        </div>

        {/* Roadmap */}
        <div className="roadmap">
          <h3 className="roadmap__title">Implementation Roadmap</h3>
          <div className="roadmap__grid">
            {roadmap.map(r => (
              <div className={`roadmap__card roadmap__card--${r.status}`} key={r.phase}>
                <div className="roadmap__phase">{r.phase}</div>
                <div className="roadmap__timeline">⏱ {r.timeline}</div>
                <h4 className="roadmap__card-title">{r.title}</h4>
                <ul className="roadmap__list">
                  {r.items.map(item => (
                    <li key={item}>
                      <span className="roadmap__check">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
