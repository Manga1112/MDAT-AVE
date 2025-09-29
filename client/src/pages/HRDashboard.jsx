import { useEffect, useState } from 'react';
import { Users, CheckCircle2, Clock, Briefcase } from 'lucide-react';
import { ResponsiveContainer, CartesianGrid, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import api from '../api/client';
import OffersPanel from '../components/OffersPanel.jsx';
import { Badge, Card } from '../components/UI.jsx';
import Filters from '../components/it/Filters.jsx';
import ChartsPanel from '../components/it/ChartsPanel.jsx';
import TicketTable from '../components/it/TicketTable.jsx';
import TeamTable from '../components/it/TeamTable.jsx';

export default function HRDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState('');
  const [screenings, setScreenings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // HR Tickets state (parity with IT)
  const [summary, setSummary] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [team, setTeam] = useState([]);
  const [updating, setUpdating] = useState('');
  const [comments, setComments] = useState({});

  // Filters & pagination
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [routeStatus, setRouteStatus] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // New states per reference
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

  // HR Tickets loaders
  const loadSummary = async () => {
    try {
      const { data } = await api.get('/tickets/summary', { params: { dept: 'HR' } });
      setSummary(data || null);
    } catch {}
  };
  const loadTeam = async () => {
    try {
      const { data } = await api.get('/tickets/team', { params: { dept: 'HR' } });
      setTeam(Array.isArray(data) ? data : []);
    } catch {}
  };
  const loadTickets = async () => {
    try {
      const params = { dept: 'HR', page, pageSize };
      if (search) params.search = search;
      if (status) params.status = status;
      if (routeStatus) params.routeStatus = routeStatus;
      if (category) params.category = category;
      if (priority) params.priority = priority;
      if (assignedTo) params.assignedTo = assignedTo;
      const { data } = await api.get('/tickets', { params });
      if (Array.isArray(data)) {
        setTickets(data);
        setTotal(data.length);
      } else {
        setTickets(Array.isArray(data.items) ? data.items : []);
        setTotal(Number(data.total) || 0);
      }
    } catch (e) {
      setTickets([]); setTotal(0);
    }
  };
  useEffect(() => { loadSummary(); loadTeam(); }, []);
  useEffect(() => { loadTickets(); /* eslint-disable-next-line */ }, [page, pageSize]);

  // Actions
  const updateStatus = async (id, status) => {
    setUpdating(id + ':' + status);
    try {
      await api.patch(`/tickets/${id}/status`, { status, comment: comments[id] || '' });
      await loadTickets();
    } finally { setUpdating(''); }
  };
  const routeTicket = async (id) => {
    setUpdating(id + ':route');
    try { await api.post(`/tickets/${id}/route`, { notes: comments[id] || '' }); await loadTickets(); await loadSummary(); }
    finally { setUpdating(''); }
  };
  const autoRoute = async (id) => {
    setUpdating(id + ':autoroute');
    try { await api.post(`/tickets/${id}/autoroute`); await loadTickets(); await loadSummary(); await loadTeam(); }
    finally { setUpdating(''); }
  };
  const assignTo = async (id, userId) => {
    setUpdating(id + ':assign');
    try { await api.post(`/tickets/${id}/assign`, { userId }); await loadTickets(); await loadTeam(); }
    finally { setUpdating(''); }
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
      await api.post('/hr/screener/run', { job_id: jobId });
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

  // derive a simple pipeline array for chart from dashboard.pipelineCounts
  const pipelineData = (() => {
    const pc = dashboard?.pipelineCounts || {};
    // Preserve a sensible order if available
    const order = ['Applied', 'Screening', 'Offer', 'Hired', 'Rejected'];
    const keys = Object.keys(pc);
    const ordered = order.filter(k => keys.includes(k)).concat(keys.filter(k => !order.includes(k)));
    return ordered.map(k => ({ stage: k, count: Number(pc[k] || 0) }));
  })();

  const maxCount = Math.max(1, ...pipelineData.map(p => p.count || 0));

  return (
    <div className="container">
      {/* Header */}
      <Card style={{ padding: 18 }} header={(
        <div className="grad-hr" style={{ padding: 4, borderRadius: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="label" style={{ fontSize: 20 }}>Recruiting</div>
              <div className="sub">Screening tools and job status in one place</div>
            </div>
          </div>
        </div>
      )} />

      {error && <div style={{ color: '#fecaca', marginBottom: 12 }}>{error}</div>}

      {/* Metrics */}
      <section style={{ margin: '16px 0' }}>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <Card header={(<div className="label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="sub" style={{ fontWeight: 600 }}>Applicants</span>
            <Users size={18} style={{ opacity: .8 }} />
          </div>)}>
            <div className="label" style={{ fontSize: 24 }}>{pipelineData.find(p => p.stage === 'Applied')?.count ?? 0}</div>
            <div className="sub">Last 7 days</div>
          </Card>
          <Card header={(<div className="label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="sub" style={{ fontWeight: 600 }}>Screening</span>
            <Clock size={18} style={{ opacity: .8 }} />
          </div>)}>
            <div className="label" style={{ fontSize: 24 }}>{pipelineData.find(p => p.stage === 'Screening')?.count ?? 0}</div>
            <div className="sub">Last 7 days</div>
          </Card>
          <Card header={(<div className="label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="sub" style={{ fontWeight: 600 }}>Offers</span>
            <Briefcase size={18} style={{ opacity: .8 }} />
          </div>)}>
            <div className="label" style={{ fontSize: 24 }}>{pipelineData.find(p => p.stage === 'Offer')?.count ?? 0}</div>
            <div className="sub">Last 7 days</div>
          </Card>
          <Card header={(<div className="label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="sub" style={{ fontWeight: 600 }}>Hired</span>
            <CheckCircle2 size={18} style={{ opacity: .8 }} />
          </div>)}>
            <div className="label" style={{ fontSize: 24 }}>{pipelineData.find(p => p.stage === 'Hired')?.count ?? 0}</div>
            <div className="sub">Last 7 days</div>
          </Card>
        </div>
      </section>

      {/* Pipeline + Screener */}
      <section style={{ margin: '16px 0', display: 'grid', gap: 16, gridTemplateColumns: '1.1fr 1fr' }}>
        <Card header={(<div className="label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Pipeline Status</span>
          <Badge variant="secondary">Last 7d</Badge>
        </div>)}>
          <div style={{ height: 288, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
                <XAxis dataKey="stage" tickLine={false} axisLine={false} stroke="rgba(255,255,255,0.85)" />
                <YAxis width={30} tickLine={false} axisLine={false} stroke="rgba(255,255,255,0.85)" />
                <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)' }} />
                <Bar dataKey="count" fill="url(#barGradient)" radius={[6,6,0,0]} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card header={(<div className="label">Resume Screener</div>)}>
          <div style={{ display: 'grid', gap: 10 }}>
            <div>
              <label className="sub">Select a job</label>
              <select value={jobId} onChange={(e) => setJobId(e.target.value)} required>
                <option value="">Select a job</option>
                {jobs.map((j) => (
                  <option key={j._id} value={j._id}>{j.title} - {j.department}</option>
                ))}
              </select>
            </div>
            {/* Throughput progress */}
            {enqJobId && (
              <div>
                <div className="sub" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span>Throughput</span>
                  <span>{enqProgress.processed}/{enqProgress.total}</span>
                </div>
                <div style={{ height: 10, borderRadius: 99, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, Math.round((enqProgress.total ? (enqProgress.processed / enqProgress.total) : 0) * 100))}%`, height: '100%', background: 'linear-gradient(90deg,#4f46e5,#8b5cf6)' }} />
                </div>
                <div className="sub" style={{ marginTop: 6 }}>Job #{enqJobId}: {enqStatus}</div>
                {jobSummary && (
                  <div className="sub" style={{ marginTop: 4 }}>
                    Provider: {jobSummary.provider || '-'}
                    {jobSummary.token_usage && (
                      <span>{` | Tokens: total ${jobSummary.token_usage.total_tokens ?? '-'}, prompt ${jobSummary.token_usage.prompt_tokens ?? '-'}, completion ${jobSummary.token_usage.completion_tokens ?? '-'}`}</span>
                    )}
                  </div>
                )}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn" onClick={runBulkScreening} disabled={running || !jobId}>{running ? 'Screening…' : 'Perform Screening'}</button>
              <button className="btn secondary" onClick={enqueueScreening} disabled={!jobId}>Enqueue Job</button>
            </div>
          </div>
        </Card>
      </section>

      {/* Tickets + Offers */}
      <section style={{ margin: '16px 0', display: 'grid', gap: 16, gridTemplateColumns: '1.1fr 1fr' }}>
        <div className="panel">
          <div className="panel-title">HR Tickets</div>
          {summary && (
            <div style={{ margin: '8px 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
                <Card style={{ padding: 0 }} header={<div style={{ padding: 12 }}><div className="sub">Pending</div><div className="label" style={{ fontSize: 22 }}>{summary.pending}</div></div>} />
                <Card style={{ padding: 0 }} header={<div style={{ padding: 12 }}><div className="sub">Routed</div><div className="label" style={{ fontSize: 22 }}>{summary.routed}</div></div>} />
                <Card style={{ padding: 0 }} header={<div style={{ padding: 12 }}><div className="sub">Working</div><div className="label" style={{ fontSize: 22 }}>{summary.working}</div></div>} />
                <Card style={{ padding: 0 }} header={<div style={{ padding: 12 }}><div className="sub">Resolved</div><div className="label" style={{ fontSize: 22 }}>{summary.resolved}</div></div>} />
              </div>
            </div>
          )}
          <Filters
            state={{ search, status, routeStatus, category, priority, assignedTo, pageSize }}
            team={team}
            onChange={(patch)=>{
              if (patch.search!==undefined) setSearch(patch.search);
              if (patch.status!==undefined) setStatus(patch.status);
              if (patch.routeStatus!==undefined) setRouteStatus(patch.routeStatus);
              if (patch.category!==undefined) setCategory(patch.category);
              if (patch.priority!==undefined) setPriority(patch.priority);
              if (patch.assignedTo!==undefined) setAssignedTo(patch.assignedTo);
              if (patch.pageSize!==undefined) setPageSize(patch.pageSize);
              setPage(1);
            }}
            onReset={()=>{ setSearch(''); setStatus(''); setRouteStatus(''); setCategory(''); setPriority(''); setAssignedTo(''); setPage(1); loadTickets(); }}
            onApply={loadTickets}
          />
          <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
            <ChartsPanel tickets={tickets} summary={summary} />
            <TicketTable
              tickets={tickets}
              team={team}
              updating={updating}
              comments={comments}
              onUpdateStatus={updateStatus}
              onRoute={routeTicket}
              onAutoRoute={autoRoute}
              onAssign={assignTo}
              onCommentChange={(id, value) => setComments((m) => ({ ...m, [id]: value }))}
              onFetchTicket={async (id) => { const { data } = await api.get(`/tickets/${id}`); return data; }}
              onAddComment={async (id, text) => { await api.post(`/tickets/${id}/comment`, { comment: text }); }}
            />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div className="muted">Page {page} of {Math.max(1, Math.ceil(total / pageSize))} • {total} tickets</div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn secondary" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</button>
                <button className="btn" disabled={page>=Math.ceil(total/pageSize)} onClick={()=>setPage(p=>p+1)}>Next</button>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="label" style={{ marginBottom: 8 }}>Offers</div>
          <OffersPanel jobId={jobId || undefined} />
        </div>
      </section>

      {/* Activity and Job Description */}
      <section style={{ margin: '16px 0', display: 'grid', gap: 16, gridTemplateColumns: '1.1fr 1fr' }}>
        <div className="card" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="label" style={{ marginBottom: 8 }}>Activity</div>
          <ol style={{ position: 'relative', borderLeft: '1px solid rgba(255,255,255,0.12)', paddingLeft: 16, display: 'grid', gap: 12 }}>
            {(screenings || []).slice(0, 5).map((s, i) => (
              <li key={s.id || s._id || i} className="sub" style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: -6.5, top: 6, width: 10, height: 10, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#8b5cf6)', border: '1px solid rgba(255,255,255,0.35)' }} />
                <div style={{ fontWeight: 600 }}>Screening {s.status || '-'} for {s.candidate_name || s.candidateId || 'Candidate'}</div>
                <div className="sub" style={{ fontSize: 12 }}>Score: {s.overall_score ?? s.score ?? '-'}{s.rationale ? ` • ${String(s.rationale).slice(0, 80)}...` : ''}</div>
              </li>
            ))}
          </ol>
        </div>
        <div className="card" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="label" style={{ marginBottom: 8 }}>Job Description</div>
          <div className="sub">
            {(() => {
              const j = jobs.find(x => x._id === jobId);
              return j?.jdText ? j.jdText : 'Select a job to view JD.';
            })()}
          </div>
        </div>
      </section>
    </div>
  );
}
