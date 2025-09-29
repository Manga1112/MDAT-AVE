import { useEffect, useState } from 'react';
import api from '../api/client';

export default function TicketsPanel({ ownerDepartment }) {
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/tickets', { params: ownerDepartment ? { dept: ownerDepartment } : {} });
        // Normalize API response to an array. Accept either an array or { tickets: [...] }
        const normalized = Array.isArray(data)
          ? data
          : (Array.isArray(data?.tickets) ? data.tickets : []);
        setTickets(normalized);
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load tickets');
      }
    })();
  }, [ownerDepartment]);

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div className="sub">Tickets for {ownerDepartment || 'Dept'}</div>
      {error && <div style={{ color: '#fecaca' }}>{error}</div>}
      <div style={{ display: 'grid', gap: 8 }}>
        {(Array.isArray(tickets) ? tickets : []).map((t) => (
          <div key={t._id} style={{ padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div><strong>{t.title}</strong> <span className="sub">({t.type})</span></div>
            <div className="sub">Status: {t.status} • Created: {new Date(t.createdAt).toLocaleString()}</div>
          </div>
        ))}
        {(!Array.isArray(tickets) || tickets.length === 0) && !error && <div className="sub">No tickets.</div>}
      </div>
    </div>
  );
}
