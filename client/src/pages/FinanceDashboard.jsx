import { useEffect, useState } from 'react';
import api from '../api/client';

export default function FinanceDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/dashboard/finance');
        setData(data);
      } catch (e) {
        setError('Failed to load Finance dashboard');
      }
    })();
  }, []);

  return (
    <div className="container">
      <div className="card grad-finance" style={{ padding: 18, marginBottom: 16 }}>
        <div className="label">Finance Dashboard</div>
        <div className="sub">Hiring budget, offers, and compliance checks</div>
      </div>

      {error && <div style={{ color: '#fecaca', marginBottom: 12 }}>{error}</div>}

      {data && (
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div className="card" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="sub">Open Jobs</div>
            <div className="label" style={{ fontSize: 22 }}>{data.openJobs ?? '-'}</div>
          </div>
          <div className="card" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="sub">Pending Approvals</div>
            <div className="label" style={{ fontSize: 22 }}>{data.pendingApprovals ?? '-'}</div>
          </div>
        </div>
      )}
    </div>
  );
}
