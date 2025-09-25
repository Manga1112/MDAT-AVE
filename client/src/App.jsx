import './App.css';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import HRDashboard from './pages/HRDashboard';
import ITDashboard from './pages/ITDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import FinanceDashboard from './pages/FinanceDashboard';
import CandidatePortal from './pages/CandidatePortal';
import { useAuth } from './context/AuthContext';
import AdminDashboard from './pages/AdminDashboard';
import { useTheme } from './context/ThemeContext.jsx';
import Brand from './components/Brand.jsx';
import Profile from './pages/Profile.jsx';
import EmployeeDashboard from './pages/EmployeeDashboard.jsx';

function App() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  return (
    <div>
      <header className="header">
        <div className="brand"><Link to="/" style={{ textDecoration: 'none' }}><Brand size={22} /></Link></div>
        <div className="nav-right">
          {location.pathname !== '/' && (<Link to="/" className="btn">Home</Link>)}
          {!user && <Link to="/login" className="btn">Login</Link>}
          <button className="btn" onClick={toggle} title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}>
            {theme === 'dark' ? '🌞' : '🌙'} Theme
          </button>
        {user && (
          <>
            <div className="spacer" />
            <button onClick={() => setMenuOpen(o => !o)} className="btn" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg,#6366f1,#ec4899)',
              display: 'grid', placeItems: 'center', marginRight: 8,
              border: '1px solid rgba(255,255,255,0.25)'
            }} aria-hidden>
                <span style={{ fontSize: 14, fontWeight: 800 }}>
                  {String(user.username || '?').slice(0,1).toUpperCase()}
                </span>
              </span>
              <span style={{ opacity: .9 }}>Hi, <strong>{user.username}</strong> <span style={{ opacity: .75 }}>({user.role})</span></span>
            </button>
            {menuOpen && (
              <div style={{ position: 'absolute', top: 56, right: 16, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.35)' }}>
                {user.role === 'Admin' && (
                  <Link onClick={() => setMenuOpen(false)} to="/admin" className="btn" style={{ display: 'block', width: '100%', borderRadius: 0 }}>Admin</Link>
                )}
                <Link onClick={() => setMenuOpen(false)} to="/profile" className="btn" style={{ display: 'block', width: '100%', borderRadius: 0 }}>Profile</Link>
                <button className="btn" style={{ display: 'block', width: '100%', borderRadius: 0 }} onClick={() => { setMenuOpen(false); logout(); }}>Logout</button>
              </div>
            )}
          </>
        )}
        </div>
      </header>
      <div style={{ animation: 'fade-in .35s ease both' }}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route element={<ProtectedRoute allow={["HR", "Admin"]} />}> 
          <Route path="/hr" element={<HRDashboard />} />
        </Route>
        <Route element={<ProtectedRoute allow={["IT", "Admin"]} />}> 
          <Route path="/it" element={<ITDashboard />} />
        </Route>
        <Route element={<ProtectedRoute allow={["Manager", "HR", "Admin"]} />}> 
          <Route path="/manager" element={<ManagerDashboard />} />
        </Route>
        <Route element={<ProtectedRoute allow={["Finance", "Admin"]} />}> 
          <Route path="/finance" element={<FinanceDashboard />} />
        </Route>
        <Route element={<ProtectedRoute allow={["Employee", "Admin"]} />}> 
          <Route path="/employee" element={<EmployeeDashboard />} />
        </Route>
        <Route element={<ProtectedRoute allow={["Candidate", "Admin"]} />}> 
          <Route path="/candidate" element={<CandidatePortal />} />
        </Route>
        <Route element={<ProtectedRoute allow={["Admin"]} />}> 
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
        <Route element={<ProtectedRoute allow={["Admin", "HR", "IT", "Manager", "Finance", "Candidate"]} />}> 
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
      </div>
      <footer className="app-footer">
        <div className="container footer-content">
          <div className="footer-left">
            <span className="muted">Powered by</span> <Brand size={16} />
            <span className="footer-tagline">Automation at scale</span>
          </div>
          <div className="footer-right">
            <a className="footer-link" href="https://github.com/Manga1112/MDAT#readme" target="_blank" rel="noreferrer" title="Documentation">Docs</a>
            <a className="footer-link" href="https://github.com/Manga1112/MDAT/issues" target="_blank" rel="noreferrer" title="Support">Support</a>
            <span className="muted">v0.1.0 • © {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
