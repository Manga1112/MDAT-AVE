import { useEffect, useState } from 'react';
import api from '../api/client';

export default function ITDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState([]);
  const [updating, setUpdating] = useState('');
  const [comments, setComments] = useState({});

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

  const loadTickets = async () => {
    try {
      const { data } = await api.get('/tickets', { params: { dept: 'IT' } });
      setTickets(data || []);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => { loadTickets(); }, []);

  const setStatus = async (id, status) => {
    setUpdating(id + ':' + status);
    try {
      await api.patch(`/tickets/${id}/status`, { status, comment: comments[id] || '' });
      await loadTickets();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to update ticket');
    } finally {
      setUpdating('');
    }
  };

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

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-title">IT Tickets</div>
        <div className="panel-sub">Manage tickets assigned to the IT department</div>
        <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
          {tickets.map(t => (
            <div key={t._id} className="job-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div><strong>{t.title}</strong> <span className="muted">({t.type})</span></div>
                  <div className="muted">Created: {new Date(t.createdAt).toLocaleString()}</div>
                </div>
                <div className="tag">{t.status}</div>
              </div>
              <div className="muted" style={{ marginTop: 6 }}>{t.description}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input
                  placeholder="Add comment (optional)"
                  value={comments[t._id] || ''}
                  onChange={(e) => setComments((m) => ({ ...m, [t._id]: e.target.value }))}
                  style={{ flex: 1 }}
                />
                <button className="btn secondary" disabled={!!updating} onClick={() => setStatus(t._id, 'In Progress')}>{updating === t._id + ':In Progress' ? 'Updating…' : 'Mark In Progress'}</button>
                <button className="btn" disabled={!!updating} onClick={() => setStatus(t._id, 'Resolved')}>{updating === t._id + ':Resolved' ? 'Updating…' : 'Mark Resolved'}</button>
              </div>
            </div>
          ))}
          {!tickets.length && <div className="muted">No IT tickets</div>}
        </div>
      </section>
    </div>
  );
}
