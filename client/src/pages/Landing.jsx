import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { user } = useAuth();
  const displayName = user?.username ? user.username : 'Guest';

  const cards = [
    { to: '/login?role=HR', label: 'HR', sub: 'Talent & hiring workflows', cls: 'grad-hr', icon: '👥' },
    { to: '/login?role=IT', label: 'IT', sub: 'Systems, AI & support', cls: 'grad-it', icon: '💻' },
    { to: '/login?role=Manager', label: 'Manager', sub: 'Pipeline & decisions', cls: 'grad-manager', icon: '🧭' },
    { to: '/login?role=Finance', label: 'Finance', sub: 'Budget & approvals', cls: 'grad-finance', icon: '💰' },
    { to: '/login?role=Candidate', label: 'Candidate', sub: 'Apply & track status', cls: 'grad-candidate', icon: '📄' },
    { to: '/login?role=Admin', label: 'Admin', sub: 'Access & user control', cls: 'grad-admin', icon: '🛡️' },
  ];

  return (
    <div className="container">
      <div style={{ margin: '18px 0 24px' }}>
        <h1 style={{ margin: 0, fontSize: 28, letterSpacing: 0.3 }}>Multi‑Department Automation Hub</h1>
        <div style={{ opacity: 0.85, marginTop: 6 }}>Welcome, <strong>{displayName}</strong>. Choose your workspace:</div>
      </div>

      <div className="cards">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} style={{ textDecoration: 'none' }}>
            <div className={`card ${c.cls}`}>
              <div className="icon" aria-hidden>{c.icon}</div>
              <div className="label">{c.label}</div>
              <div className="sub">{c.sub}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
