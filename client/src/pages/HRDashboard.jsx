import { useEffect, useState } from 'react';
import api from '../api/client';
import TicketsPanel from '../components/TicketsPanel.jsx';
import OffersPanel from '../components/OffersPanel.jsx';
import ApplicationsList from '../components/ApplicationsList.jsx';

export default function HRDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [candidateId, setCandidateId] = useState('');
  const [jobId, setJobId] = useState('');
  const [screenings, setScreenings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // New states per reference
  const [candidateIdsBulk, setCandidateIdsBulk] = useState('');
  const [running, setRunning] = useState(false);
  const [enqJobId, setEnqJobId] = useState('');
  const [enqStatus, setEnqStatus] = useState('');
  const [enqProgress, setEnqProgress] = useState({ total: 0, processed: 0 });
  const [jobSummary, setJobSummary] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const load = async () => {
    try {
      const [dRes, jRes, sRes] = await Promise.all([
        api.get('/dashboard/hr'),
        api.get('/jobs'),
        api.get('/screenings'),
      ]);
      setDashboard(dRes.data);
      setJobs(jRes.data);
      setScreenings(sRes.data);
    } catch (e) {
      setError('Failed to load HR dashboard');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const runScreening = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/screenings/run', { candidateId, jobId });
      await load();
      setCandidateId('');
      // setJobId(''); keep selected
    } catch (e) {
      setError(e?.response?.data?.message || 'Screening failed');
    } finally {
      setLoading(false);
    }
  };

  // Reference: run bulk screening for a job and optional candidate ids
  const runBulkScreening = async () => {
    if (!jobId) {
      setError('Please select a Job for screening');
      return;
    }
    setError('');
    setRunning(true);
    setScreenings([]);
    try {
      const body = { job_id: jobId };
      if (candidateIdsBulk.trim()) {
        // allow comma-separated ObjectIds
        body.candidate_ids = candidateIdsBulk.split(',').map(x => x.trim()).filter(Boolean);
      }
      await api.post('/hr/screener/run', body);
      const r = await api.get('/hr/screener/results', { params: { job_id: jobId } });
      setScreenings(r.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to run screening');
    } finally {
      setRunning(false);
    }
  };

  const enqueueScreening = async () => {
    if (!jobId) {
      setError('Please select a Job');
      return;
    }
    setError('');
    try {
      const res = await api.post('/hr/screener/enqueue', { job_id: jobId });
      const sj = res.data?.screening_job;
      if (sj) {
        setEnqJobId(sj.id);
        setEnqStatus(sj.status);
        setEnqProgress({ total: sj.total || 0, processed: sj.processed || 0 });
        setJobSummary(null);
        try { localStorage.setItem('screening_job_id', String(sj.id)); } catch {}
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to enqueue screening job');
    }
  };

  // Poll job status
  useEffect(() => {
    let t;
    if (!enqJobId) {
      try {
        const saved = localStorage.getItem('screening_job_id');
        if (saved) setEnqJobId(saved);
      } catch {}
    }
    const poll = async () => {
      if (!enqJobId) return;
      try {
        const res = await api.get(`/hr/screener/job/${enqJobId}`);
        const sj = res.data;
        setEnqStatus(sj.status);
        setEnqProgress({ total: sj.total || 0, processed: sj.processed || 0 });
        if (sj.status === 'completed') {
          setJobSummary({ provider: sj.provider, token_usage: sj.token_usage });
          if (jobId) {
            const r = await api.get('/hr/screener/results', { params: { job_id: jobId } });
            setScreenings(r.data || []);
          }
          setToast({ show: true, message: `Screening completed for Job #${enqJobId}`, type: 'success' });
          setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
          try { localStorage.removeItem('screening_job_id'); } catch {}
          return;
        }
        if (sj.status === 'failed') {
          try { localStorage.removeItem('screening_job_id'); } catch {}
          return;
        }
        t = setTimeout(poll, 1500);
      } catch (e) {
        t = setTimeout(poll, 3000);
      }
    };
    poll();
    return () => t && clearTimeout(t);
  }, [enqJobId, jobId]);

  return (
    <div className="container">
      <div className="card grad-hr" style={{ padding: 18, marginBottom: 16 }}>
        <div className="label">HR Dashboard</div>
        <div className="sub">Pipeline health, resume screening and recent results</div>
      </div>

      {error && <div style={{ color: '#fecaca', marginBottom: 12 }}>{error}</div>}

      <section className="card" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 16 }}>
        <div className="label" style={{ marginBottom: 8 }}>Tickets</div>
        <TicketsPanel ownerDepartment="HR" />
      </section>

      <section style={{ margin: '16px 0' }}>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          {dashboard?.pipelineCounts && Object.entries(dashboard.pipelineCounts).map(([k, v]) => (
            <div key={k} className="card" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="sub" style={{ textTransform: 'uppercase', letterSpacing: '.08em' }}>{k}</div>
              <div className="label" style={{ fontSize: 24 }}>{v}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ margin: '16px 0', display: 'grid', gap: 16, gridTemplateColumns: '1.1fr 1fr' }}>
        <div className="card" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="label" style={{ marginBottom: 8 }}>Resume Screener</div>
          {/* Single candidate screening (existing) */}
          <form onSubmit={runScreening} style={{ display: 'grid', gap: 10 }}>
            <div>
              <label className="sub">Candidate ID</label>
              <input value={candidateId} onChange={(e) => setCandidateId(e.target.value)} required style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)', color: '#fff' }} />
            </div>
            <div>
              <label className="sub">Job</label>
              <select value={jobId} onChange={(e) => setJobId(e.target.value)} required style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)', color: '#fff' }}>
                <option value="">Select a job</option>
                {jobs.map((j) => (
                  <option key={j._id} value={j._id}>{j.title} - {j.department}</option>
                ))}
              </select>
            </div>
            <button className="btn" type="submit" disabled={loading}>{loading ? 'Screening...' : 'Run Screening'}</button>
          </form>

          {/* Bulk screening controls per reference */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 12, paddingTop: 12, display: 'grid', gap: 10 }}>
            <div>
              <label className="sub">Candidate IDs (optional, comma-separated)</label>
              <input value={candidateIdsBulk} onChange={(e) => setCandidateIdsBulk(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)', color: '#fff' }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn" onClick={runBulkScreening} disabled={running}>{running ? 'Screening…' : 'Run Resume Screening'}</button>
              <button className="btn" onClick={enqueueScreening}>Enqueue Job</button>
            </div>
            {enqJobId && (
              <div className="sub">
                Job #{enqJobId}: {enqStatus} ({enqProgress.processed}/{enqProgress.total})
                {jobSummary && (
                  <div className="sub">
                    Provider: {jobSummary.provider || '-'}
                    {jobSummary.token_usage && (
                      <span>
                        {` | Tokens: total ${jobSummary.token_usage.total_tokens ?? '-'}, prompt ${jobSummary.token_usage.prompt_tokens ?? '-'}, completion ${jobSummary.token_usage.completion_tokens ?? '-'}`}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', maxHeight: 360, overflow: 'auto' }}>
          <div className="label" style={{ marginBottom: 8 }}>Recent Screenings</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {screenings.map((s) => (
              <div key={s.id || s._id} style={{ padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
                <div className="sub">Candidate: {s.candidate_name || s.candidate_id} • Job: {jobId}</div>
                <div><strong>Score:</strong> {s.overall_score ?? s.score ?? '-'} <span className="sub">({s.status || '-'})</span></div>
                {s.rationale && <div className="sub" style={{ marginTop: 6 }}>{s.rationale}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Show selected Job's JD text for quick reference */}
      <section className="card" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 16 }}>
        <div className="label" style={{ marginBottom: 8 }}>Job Description</div>
        <div className="sub">
          {(() => {
            const j = jobs.find(x => x._id === jobId);
            return j?.jdText ? j.jdText : 'Select a job to view JD.';
          })()}
        </div>
      </section>

      <section className="card" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 16 }}>
        <div className="label" style={{ marginBottom: 8 }}>Applications</div>
        <ApplicationsList onSelectApplication={(cid) => setCandidateId(cid)} selectedCandidateId={candidateId} />
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <button className="btn" onClick={(e)=>{ if (candidateId && jobId) runScreening(e); }} disabled={!candidateId || !jobId || loading}>
            {loading ? 'Screening…' : 'Screen Selected Application'}
          </button>
        </div>
      </section>

      <section className="card" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 16 }}>
        <div className="label" style={{ marginBottom: 8 }}>Offers</div>
        <OffersPanel candidateId={candidateId || undefined} jobId={jobId || undefined} />
      </section>

      <section style={{ margin: '16px 0' }}>
        <div className="card" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="label" style={{ marginBottom: 8 }}>Recent Screenings</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {screenings.map((s) => (
              <div key={s._id} style={{ padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
                <div className="sub">Candidate: {s.candidateId} • Job: {s.jobId}</div>
                <div><strong>Score:</strong> {s.score ?? '-'} <span className="sub">({s.status})</span></div>
                {s.rationale && <div className="sub" style={{ marginTop: 6 }}>{s.rationale}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
