import { useEffect, useState } from 'react';
import api from '../api/client';

export default function OffersPanel({ candidateId, jobId }) {
  const [offers, setOffers] = useState([]);
  const [salary, setSalary] = useState('');
  const [startDate, setStartDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/offers', { params: { candidateId, jobId } });
      setOffers(data || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load offers');
    }
  };

  useEffect(() => {
    if (candidateId || jobId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateId, jobId]);

  const createOffer = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/offers', { candidateId, jobId, salary: Number(salary) || undefined, startDate, notes });
      setSalary(''); setStartDate(''); setNotes('');
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to create offer');
    }
  };

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div className="sub">Offers {candidateId ? `(Candidate ${candidateId})` : ''} {jobId ? `(Job ${jobId})` : ''}</div>
      {error && <div style={{ color: '#fecaca' }}>{error}</div>}
      <div style={{ display: 'grid', gap: 8 }}>
        {offers.map((o) => (
          <div key={o._id} style={{ padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div><strong>{o.status}</strong> <span className="sub">created {new Date(o.createdAt).toLocaleString()}</span></div>
            <div className="sub">Salary: {o.salary ?? '-'} {o.currency || ''} • Start: {o.startDate ? new Date(o.startDate).toLocaleDateString() : '-'}</div>
            {o.notes && <div className="sub">Notes: {o.notes}</div>}
          </div>
        ))}
        {offers.length === 0 && <div className="sub">No offers yet.</div>}
      </div>
      {(candidateId && jobId) && (
        <form onSubmit={createOffer} style={{ display: 'grid', gap: 8, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10 }}>
          <div className="label">Create Offer</div>
          <input type="number" placeholder="Salary" value={salary} onChange={(e) => setSalary(e.target.value)} />
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <textarea placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <button className="btn" type="submit">Create Offer</button>
        </form>
      )}
    </div>
  );
}
