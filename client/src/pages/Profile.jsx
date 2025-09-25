import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  return (
    <div className="container">
      <div className="card" style={{ padding: 18, marginBottom: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="label">Profile</div>
        <div className="sub">Account details</div>
      </div>
      <div className="card" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'grid', gap: 10 }}>
          <div><strong>Username:</strong> {user?.username}</div>
          <div><strong>Role:</strong> {user?.role}</div>
        </div>
      </div>
    </div>
  );
}
