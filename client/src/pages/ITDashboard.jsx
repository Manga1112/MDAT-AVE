import { useEffect, useState } from 'react';
import api from '../api/client';

export default function ITDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/dashboard/it');
        setData(data);
      } catch (e) {
        setError('Failed to load IT dashboard');
      }
    })();
  }, []);

  return (
    <div className="container">
      <div className="card grad-it" style={{ padding: 18, marginBottom: 16 }}>
        <div className="label">IT Dashboard</div>
        <div className="sub">System health, AI screening status, and tickets</div>
      </div>

      {error && <div style={{ color: '#fecaca', marginBottom: 12 }}>{error}</div>}

      {data && (
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div className="card" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="sub">API</div>
            <div className="label" style={{ fontSize: 22 }}>{data.systemHealth?.api || 'unknown'}</div>
          </div>
          <div className="card" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="sub">Screenings • Total</div>
            <div className="label" style={{ fontSize: 22 }}>{data.screeningStats?.total ?? '-'}</div>
          </div>
          <div className="card" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="sub">Screenings • Completed</div>
            <div className="label" style={{ fontSize: 22 }}>{data.screeningStats?.completed ?? '-'}</div>
          </div>
          <div className="card" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="sub">Screenings • Failed</div>
            <div className="label" style={{ fontSize: 22 }}>{data.screeningStats?.failed ?? '-'}</div>
          </div>
          <div className="card" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="sub">Open IT Tickets</div>
            <div className="label" style={{ fontSize: 22 }}>{data.openTickets ?? '-'}</div>
          </div>
        </div>
      )}
    </div>
  );
}
