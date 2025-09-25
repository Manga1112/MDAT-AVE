import './App.css';
import { Routes, Route, Link } from 'react-router-dom';
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
import Profile from './pages/Profile.jsx';

function App() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div>
      <header className="header">
        <div className="brand"><Link to="/" style={{ textDecoration: 'none' }}>Automation Hub</Link></div>
        <Link to="/" className="btn">Home</Link>
        {!user && <Link to="/login" className="btn">Login</Link>}
        <button className="btn" onClick={toggle} title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}>
          {theme === 'dark' ? '🌞' : '🌙'} Theme
        </button>
        {user && (
          <>
            {user.role === 'Admin' && <Link to="/admin" className="btn">Admin</Link>}
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
                <Link onClick={() => setMenuOpen(false)} to="/profile" className="btn" style={{ display: 'block', width: '100%', borderRadius: 0 }}>Profile</Link>
                <button className="btn" style={{ display: 'block', width: '100%', borderRadius: 0 }} onClick={() => { setMenuOpen(false); logout(); }}>Logout</button>
              </div>
            )}
          </>
        )}
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
    </div>
  );
}

export default App;
