import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Brand from './Brand.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const menuRef = useRef(null);
  const userRef = useRef(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const workspaces = ['HR', 'IT', 'Finance', 'Employee'];

  return (
    <div className="navbar-wrap">
      <header className="navbar">
        <div className="navbar-left">
          <Link to="/" className="brand-pill" aria-label="Home">
            <span className="brand-dot" aria-hidden />
            <span className="brand-text"><Brand size={16} /></span>
          </Link>

          <div className="workspace" ref={menuRef}>
            <button className="workspace-btn" onClick={() => setOpen(o => !o)}>
              <span className="ws-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 3h7v7H3V3Zm0 11h7v7H3v-7Zm11-11h7v7h-7V3Zm0 11h7v7h-7v-7Z" stroke="currentColor" strokeWidth="1.6"/>
                </svg>
              </span>
              <span>Workspace</span>
              <svg className="caret" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {open && (
              <div className="ws-menu">
                <div className="ws-menu__header">Switch workspace</div>
                {workspaces.map(ws => (
                  <button key={ws} className="ws-item" onClick={() => { setOpen(false); navigate(`/login?role=${encodeURIComponent(ws)}`); }}>
                    {ws}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="navbar-center">
          <div className="search">
            <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-5.65-5.65" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            <input ref={searchRef} placeholder="Search… (/)" />
          </div>
        </div>

        <div className="navbar-right">
          <button className="icon-btn" title="Help" aria-label="Help">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 18h.01M9.09 9a3 3 0 1 1 5.83 1c-.54 1.04-1.82 1.54-2.42 2.5-.27.42-.4.9-.4 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="icon-btn" onClick={toggle} title={theme === 'dark' ? 'Light mode' : 'Dark mode'} aria-label="Toggle theme">
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" stroke="currentColor" strokeWidth="1.8"/></svg>
            )}
          </button>
          <button className="user-btn" onClick={() => setUserOpen(o => !o)} ref={userRef}>
            <span className="avatar" aria-hidden>{(user?.username || 'AD').slice(0,2).toUpperCase()}</span>
            <div className="user-meta">
              <div className="user-name">{user?.username || 'admin'}</div>
              <div className="user-role">{user?.role || 'Admin'}</div>
            </div>
            <svg className="caret" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {userOpen && (
            <div className="user-menu">
              <Link to="/profile" className="user-item">Profile</Link>
              {user?.role === 'Admin' && <Link to="/admin" className="user-item">Admin</Link>}
              {user ? (
                <button className="user-item user-action no-hover" onClick={() => { setUserOpen(false); logout(); navigate('/'); }}>Logout</button>
              ) : (
                <Link to="/login" className="user-item user-action no-hover" onClick={() => setUserOpen(false)}>Login</Link>
              )}
            </div>
          )}
        </div>
      </header>
      <div className="navbar-divider" />
    </div>
  );
}
