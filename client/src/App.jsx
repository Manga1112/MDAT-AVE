import './App.css';
import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import HRDashboard from './pages/HRDashboard';
import ITDashboard from './pages/ITDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import FinanceDashboard from './pages/FinanceDashboard';
import CandidatePortal from './pages/CandidatePortal';
import AdminDashboard from './pages/AdminDashboard';
import { useTheme } from './context/ThemeContext.jsx';
import Brand from './components/Brand.jsx';
import Profile from './pages/Profile.jsx';
import EmployeeDashboard from './pages/EmployeeDashboard.jsx';
import Navbar from './components/Navbar.jsx';

function App() {
  const { theme } = useTheme();
  return (
    <div>
      <Navbar />
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
