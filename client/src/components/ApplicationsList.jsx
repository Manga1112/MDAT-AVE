import { useEffect, useState } from 'react';
import api from '../api/client';

export default function ApplicationsList({ onSelectApplication, selectedCandidateId }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/hr/applications');
        setApps(data || []);
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load applications');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div className="sub">Applications (latest resume per candidate)</div>
      {error && <div style={{ color: '#fecaca' }}>{error}</div>}
      {loading && <div className="sub">Loading…</div>}
      <div style={{ display: 'grid', gap: 8 }}>
        {apps.map((a) => (
          <div key={a.candidateId} style={{ padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div><strong>{a.candidateName}</strong> <span className="sub">({a.candidateEmail})</span></div>
              <div className="sub">Resume: {a.resumeFilename || '-'} • Uploaded: {a.resumeUploadedAt ? new Date(a.resumeUploadedAt).toLocaleString() : '-'}</div>
            </div>
            <button className="btn" onClick={() => onSelectApplication?.(a.candidateId)} disabled={selectedCandidateId === a.candidateId}>
              {selectedCandidateId === a.candidateId ? 'Selected' : 'Select'}
            </button>
          </div>
        ))}
        {apps.length === 0 && !loading && <div className="sub">No applications found.</div>}
      </div>
    </div>
  );
}
