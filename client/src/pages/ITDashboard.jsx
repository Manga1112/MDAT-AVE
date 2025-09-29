import { useEffect, useState } from 'react';
import api from '../api/client';
import StatCard from '../components/it/StatCard.jsx';
import Filters from '../components/it/Filters.jsx';
import ChartsPanel from '../components/it/ChartsPanel.jsx';
import TicketTable from '../components/it/TicketTable.jsx';
import TeamTable from '../components/it/TeamTable.jsx';

export default function ITDashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('issues'); // issues | team

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

  const [tickets, setTickets] = useState([]);
  const [team, setTeam] = useState([]);
  const [updating, setUpdating] = useState('');
  const [comments, setComments] = useState({});

  const loadSummary = async () => {
    try {
      const { data } = await api.get('/tickets/summary', { params: { dept: 'IT' } });
      setSummary(data || null);
    } catch (e) {
      // ignore
    }
  };

  const loadTickets = async () => {
    try {
      const params = { dept: 'IT', page, pageSize };
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
      setTickets([]);
      setTotal(0);
      if (e?.response?.status === 401) setError('Unauthorized. Please sign in to view IT tickets.');
    }
  };

  const loadTeam = async () => {
    try {
      const { data } = await api.get('/tickets/team', { params: { dept: 'IT' } });
      setTeam(Array.isArray(data) ? data : []);
    } catch (e) { /* ignore */ }
  };

  useEffect(() => { loadSummary(); loadTeam(); }, []);
  useEffect(() => { loadTickets(); /* eslint-disable-next-line */ }, [page, pageSize]);

  const updateStatus = async (id, status) => {
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

  const routeTicket = async (id) => {
    setUpdating(id + ':route');
    try {
      await api.post(`/tickets/${id}/route`, { notes: comments[id] || '' });
      await loadTickets(); await loadSummary();
    } catch (e) { setError(e?.response?.data?.message || 'Failed to route'); }
    finally { setUpdating(''); }
  };

  const autoRoute = async (id) => {
    setUpdating(id + ':autoroute');
    try {
      await api.post(`/tickets/${id}/autoroute`);
      await loadTickets(); await loadSummary(); await loadTeam();
    } catch (e) { setError(e?.response?.data?.message || 'Failed to autoroute'); }
    finally { setUpdating(''); }
  };

  const assignTo = async (id, userId) => {
    setUpdating(id + ':assign');
    try {
      await api.post(`/tickets/${id}/assign`, { userId });
      await loadTickets(); await loadTeam();
    } catch (e) { setError(e?.response?.data?.message || 'Failed to assign'); }
    finally { setUpdating(''); }
  };

  return (
    <div className="container">
      <div className="cp-header" style={{ marginTop: 8 }}>
        <div>
          <h2 style={{ margin: 0 }}>IT Operations</h2>
          <div className="muted">Issues and Team management for IT</div>
        </div>
        <div className="tag">Dept: IT</div>
      </div>

      {error && <div className="tag" style={{ background: 'rgba(244,63,94,.25)', borderColor: 'rgba(244,63,94,.45)', marginBottom: 10 }}>{error}</div>}

      {summary && (
        <section className="panel" style={{ marginTop: 8 }}>
          <div className="panel-title">Overview</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
            <StatCard label="Pending" value={summary.pending} />
            <StatCard label="Routed" value={summary.routed} />
            <StatCard label="Working" value={summary.working} />
            <StatCard label="Resolved" value={summary.resolved} />
          </div>
        </section>
      )}

      <div className="panel" style={{ marginTop: 12 }}>
        <div className="panel-title" style={{ display: 'flex', gap: 8 }}>
          <button className={`btn ${tab==='issues'?'':'secondary'}`} onClick={()=>setTab('issues')}>Issues Management</button>
          <button className={`btn ${tab==='team'?'':'secondary'}`} onClick={()=>setTab('team')}>Team Management</button>
        </div>
        {/* ISSUES */}
        {tab==='issues' && (
          <div style={{ display: 'grid', gap: 12 }}>
            {/* Filters */}
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

            {/* Charts */}
            <ChartsPanel tickets={tickets} summary={summary} />

            {/* Table */}
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
              onFetchTicket={async (id) => {
                const { data } = await api.get(`/tickets/${id}`);
                return data;
              }}
              onAddComment={async (id, text) => {
                await api.post(`/tickets/${id}/comment`, { comment: text });
              }}
            />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div className="muted">Page {page} of {Math.max(1, Math.ceil(total / pageSize))} • {total} tickets</div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn secondary" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</button>
                <button className="btn" disabled={page>=Math.ceil(total/pageSize)} onClick={()=>setPage(p=>p+1)}>Next</button>
              </div>
            </div>
          </div>
        )}

        {/* TEAM */}
        {tab==='team' && (
          <div style={{ display:'grid', gap:12 }}>
            <TeamTable team={team} />
          </div>
        )}
      </div>
    </div>
  );
}
