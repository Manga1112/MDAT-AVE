import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allow = [] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allow.length) {
    const userRole = String(user.role || '').trim().toLowerCase();
    const allowSet = new Set(allow.map(r => String(r || '').trim().toLowerCase()));
    if (!allowSet.has(userRole)) return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
