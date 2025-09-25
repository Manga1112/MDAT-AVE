import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import QuotesMarquee from '../components/QuotesMarquee.jsx';
import Typewriter from '../components/Typewriter.jsx';

export default function Landing() {
  const { user } = useAuth();
  const displayName = user?.username ? user.username : 'Guest';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const cards = [
    { to: '/login?role=HR', label: 'HR', sub: 'Talent & hiring workflows', cls: 'grad-hr', icon: '👥' },
    { to: '/login?role=IT', label: 'IT', sub: 'Systems, AI & support', cls: 'grad-it', icon: '💻' },
    { to: '/login?role=Manager', label: 'Manager', sub: 'Pipeline & decisions', cls: 'grad-manager', icon: '🧭' },
    { to: '/login?role=Finance', label: 'Finance', sub: 'Budget & approvals', cls: 'grad-finance', icon: '💰' },
    { to: '/login?role=Candidate', label: 'Candidate', sub: 'Apply & track status', cls: 'grad-candidate', icon: '📄' },
    { to: '/login?role=Employee', label: 'Employee', sub: 'Projects & tickets', cls: 'grad-admin', icon: '🧑‍💼' },
  ];

  return (
    <div className="container">
      <div style={{ margin: '10px 0 18px' }}>
        <h1 className="welcome-title brand-title welcome-in" style={{ margin: 0 }}>Welcome</h1>
        <div className="muted" style={{ marginTop: 6 }}>
          <Typewriter text={`${greeting}, ${displayName}. Select your workspace to continue.`} speed={22} />
        </div>
      </div>

      <div style={{ margin: '10px 0 18px' }}>
        <QuotesMarquee intervalMs={9000} />
      </div>

      <div className="cards-grid deck-animated">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="card-link">
            <div className={`dept-card ${c.cls}`}>
              <div className="dept-card__icon" aria-hidden>{c.icon}</div>
              <div className="dept-card__title">{c.label}</div>
              <div className="dept-card__sub">{c.sub}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
