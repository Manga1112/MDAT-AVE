import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import QuotesMarquee from '../components/QuotesMarquee.jsx';
import Typewriter from '../components/Typewriter.jsx';

export default function Landing() {
  const { user } = useAuth();
  const displayName = user?.username ? user.username : 'admin';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const cards = [
    { to: '/login?role=HR', label: 'HR', sub: 'Talent & hiring workflows', cls: 'grad-hr', icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.6"/><circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.6"/><path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.6"/><path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.6"/></svg>
    ) },
    { to: '/login?role=IT', label: 'IT', sub: 'Systems, AI & support', cls: 'grad-it', icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M7 20h10" stroke="currentColor" strokeWidth="1.6"/></svg>
    ) },
    { to: '/login?role=Manager', label: 'Manager', sub: 'Pipeline & decisions', cls: 'grad-manager', icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="1.6"/></svg>
    ) },
    { to: '/login?role=Finance', label: 'Finance', sub: 'Budget & approvals', cls: 'grad-finance', icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 17h18M6 17V7m4 10V4m4 13v-6m4 6V9" stroke="currentColor" strokeWidth="1.6"/></svg>
    ) },
    { to: '/login?role=Candidate', label: 'Candidate', sub: 'Apply & track status', cls: 'grad-candidate', icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4h16v16H4z" stroke="currentColor" strokeWidth="1.6"/><path d="M7 8h10M7 12h10M7 16h6" stroke="currentColor" strokeWidth="1.6"/></svg>
    ) },
    { to: '/login?role=Employee', label: 'Employee', sub: 'Projects & tickets', cls: 'grad-admin', icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M3 9h18" stroke="currentColor" strokeWidth="1.6"/></svg>
    ) },
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
              <div className="dept-left">
                <span className={`dept-icon`}>{c.icon}</span>
                <div>
                  <div className="dept-card__title">
                    {c.label}
                    <span className="badge-active">Active</span>
                  </div>
                  <div className="dept-card__sub">{c.sub}</div>
                </div>
              </div>
              <div className="dept-right" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}
