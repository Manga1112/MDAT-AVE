import { useEffect, useState } from 'react';
import api from '../api/client';

export default function ManagerDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/dashboard/manager');
        setData(data);
      } catch (e) {
        setError('Failed to load Manager dashboard');
      }
    })();
  }, []);

  return (
    <div className="container">
      <div className="card grad-manager" style={{ padding: 18, marginBottom: 16 }}>
        <div className="label">Manager Dashboard</div>
        <div className="sub">Review screened candidates, interviews, and shortlist</div>
      </div>

      {error && <div style={{ color: '#fecaca', marginBottom: 12 }}>{error}</div>}

      {data && (
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          <div className="card" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="label" style={{ marginBottom: 8 }}>Screened</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {data.screened?.map((c) => (
                <div key={c._id} style={{ padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div><strong>{c.name}</strong></div>
                  <div className="sub">{c.email}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="label" style={{ marginBottom: 8 }}>Interviewed</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {data.interviewed?.map((c) => (
                <div key={c._id} style={{ padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div><strong>{c.name}</strong></div>
                  <div className="sub">{c.email}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="label" style={{ marginBottom: 8 }}>Shortlisted</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {data.shortlisted?.map((c) => (
                <div key={c._id} style={{ padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div><strong>{c.name}</strong></div>
                  <div className="sub">{c.email}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
