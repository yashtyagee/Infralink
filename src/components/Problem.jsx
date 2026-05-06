const problems = [
  {
    dept: 'GST Dept',
    name: 'Rajesh Enterprises',
    address: 'MG Road Bengaluru',
    color: '#7cff67',
  },
  {
    dept: 'Labour Dept',
    name: 'Rajesh Enterprizes',
    address: 'M.G. Road Bangalore',
    color: '#B497CF',
  },
  {
    dept: 'Industry Dept',
    name: 'M/s Rajesh Enterprises Pvt Ltd',
    address: 'MG Rd BLR',
    color: '#5227FF',
  },
];

export default function Problem() {
  return (
    <section className="section problem-section" id="problem">
      <div className="container">
        <div className="section-tag">The Problem</div>
        <h2 className="section-title">
          The Same Business,<br />
          <span className="gradient-text">Invisible to Every Department</span>
        </h2>
        <p className="section-desc">
          Government departments operate in silos. A single business entity
          is fragmented across multiple registries under slightly different
          names and addresses — making compliance tracking, subsidy management,
          and economic analysis fundamentally broken.
        </p>

        <div className="problem-grid">
          {problems.map((p, i) => (
            <div className="problem-card" key={i} style={{ '--accent': p.color }}>
              <div className="problem-card__dept">{p.dept}</div>
              <div className="problem-card__name">{p.name}</div>
              <div className="problem-card__address">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {p.address}
              </div>
            </div>
          ))}
        </div>

        <div className="problem-arrow">
          <div className="problem-arrow__line" />
          <div className="problem-arrow__label">All the same business — but invisible to the system</div>
        </div>

        <div className="impact-row">
          {[
            { icon: '💸', title: 'Duplicate Subsidies', desc: 'Same entity claims benefits across multiple registries' },
            { icon: '🔍', title: 'Compliance Blind Spots', desc: 'Violations go undetected across departments' },
            { icon: '📊', title: 'Inaccurate Data', desc: 'Economic statistics distorted by fragmented records' },
            { icon: '🏛️', title: 'Policy Failures', desc: 'Flawed data leads to ineffective government programs' },
          ].map(item => (
            <div className="impact-item" key={item.title}>
              <div className="impact-item__icon">{item.icon}</div>
              <div className="impact-item__title">{item.title}</div>
              <div className="impact-item__desc">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
