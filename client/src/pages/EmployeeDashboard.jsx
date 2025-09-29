import { useEffect, useState } from 'react';
import api from '../api/client';

export default function EmployeeDashboard() {
  const [projects, setProjects] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [dept, setDept] = useState('IT');
  const [type, setType] = useState('Issue');
  const [category, setCategory] = useState('other');
  const [priority, setPriority] = useState('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projCreating, setProjCreating] = useState(false);
  // Ticket details/timeline state
  const [expanded, setExpanded] = useState({}); // id -> bool
  const [details, setDetails] = useState({}); // id -> ticket
  const [loadingMap, setLoadingMap] = useState({}); // id -> bool
  const [postingMap, setPostingMap] = useState({}); // id -> bool
  const [newComment, setNewComment] = useState({}); // id -> text

  const loadTickets = async () => {
    try {
      const { data } = await api.get('/tickets', { params: { mine: 'true' } });
      // Accept either an array or { items, total }
      const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
      setTickets(items);
    } catch (e) {
      setError('Failed to load tickets');
    }
  };

  const toggleDetails = async (id) => {
    const open = !!expanded[id];
    if (open) {
      setExpanded((m) => ({ ...m, [id]: false }));
      return;
    }
    try {
      setLoadingMap((m) => ({ ...m, [id]: true }));
      const { data } = await api.get(`/tickets/${id}`);
      setDetails((m) => ({ ...m, [id]: data }));
      setExpanded((m) => ({ ...m, [id]: true }));
    } finally {
      setLoadingMap((m) => ({ ...m, [id]: false }));
    }
  };

  const addComment = async (id) => {
    const text = String(newComment[id] || '').trim();
    if (!text) return;
    try {
      setPostingMap((m) => ({ ...m, [id]: true }));
      await api.post(`/tickets/${id}/comment`, { comment: text });
      const { data } = await api.get(`/tickets/${id}`);
      setDetails((m) => ({ ...m, [id]: data }));
      setNewComment((m) => ({ ...m, [id]: '' }));
    } finally {
      setPostingMap((m) => ({ ...m, [id]: false }));
    }
  };

  const createTicket = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!dept || !type || !title) {
      setError('Please complete all required fields');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/tickets', { department: dept, type, title, description, category, priority });
      setMessage(`Ticket #${data._id} created`);
      setTitle('');
      setDescription('');
      setCategory('other');
      setPriority('medium');
      await loadTickets();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const { data } = await api.get('/projects', { params: { mine: 'true' } });
      setProjects(data || []);
    } catch (e) {
      // ignore
    }
  };

  const createProject = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!projName.trim()) { setError('Enter a project name'); return; }
    setProjCreating(true);
    try {
      await api.post('/projects', { name: projName.trim(), description: projDesc });
      setProjName('');
      setProjDesc('');
      setMessage('Project created');
      await loadProjects();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to create project');
    } finally {
      setProjCreating(false);
    }
  };

  const resendToHigherAuthority = async (ticketId) => {
    try {
      await api.post(`/tickets/${ticketId}/escalate`, { note: 'Employee requested escalation' });
      setMessage(`Ticket #${ticketId} escalated`);
      await loadTickets();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to escalate');
    }
  };

  useEffect(() => {
    loadTickets();
    loadProjects();
  }, []);

  return (
    <div className="container">
      <div className="card grad-manager" style={{ padding: 18, marginBottom: 16 }}>
        <div className="label">Employee Workspace</div>
        <div className="sub">Track your projects and raise tickets to IT/HR/Finance</div>
      </div>

      {message && <div style={{ color: '#22c55e', marginBottom: 12 }}>{message}</div>}
      {error && <div style={{ color: '#fecaca', marginBottom: 12 }}>{error}</div>}

      <section style={{ display: 'grid', gap: 16, gridTemplateColumns: '1.1fr 1fr' }}>
        <div className="panel">
          <div className="panel-title">My Projects</div>
          <div className="panel-sub">Overview of assigned projects</div>
          <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
            {projects.map(p => (
              <div key={p._id} className="job-item" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div><strong>{p.name}</strong></div>
                  <div className="muted">ID: {p._id}</div>
                </div>
                <div className="tag">{p.status}</div>
              </div>
            ))}
            {!projects.length && <div className="muted">No projects yet</div>}
            <form onSubmit={createProject} style={{ display: 'grid', gap: 8, marginTop: 6 }}>
              <div>
                <label>New Project</label>
                <input value={projName} onChange={(e) => setProjName(e.target.value)} placeholder="Project name" />
              </div>
              <div>
                <label>Description</label>
                <textarea rows={3} value={projDesc} onChange={(e) => setProjDesc(e.target.value)} placeholder="Optional description" />
              </div>
              <div>
                <button className="btn" type="submit" disabled={projCreating}>{projCreating ? 'Creating…' : 'Add Project'}</button>
              </div>
            </form>
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">Raise a Ticket</div>
          <div className="panel-sub">Send your request to the relevant department</div>
          <form onSubmit={createTicket} style={{ display: 'grid', gap: 10, marginTop: 10 }}>
            <div>
              <label>Department</label>
              <select value={dept} onChange={(e) => setDept(e.target.value)}>
                <option value="IT">IT</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
              </select>
            </div>
            <div>
              <label>Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option>Issue</option>
                <option>Access</option>
                <option>Request</option>
              </select>
            </div>
            <div>
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="other">Other</option>
                <option value="hardware">Hardware</option>
                <option value="software">Software</option>
                <option value="network">Network</option>
                <option value="salary">Salary</option>
              </select>
            </div>
            <div>
              <label>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label>Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short summary" required />
            </div>
            <div>
              <label>Description</label>
              <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add details to help resolve your ticket" />
            </div>
            <div>
              <button className="btn" type="submit" disabled={loading}>{loading ? 'Submitting…' : 'Submit Ticket'}</button>
            </div>
          </form>
        </div>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-title">My Tickets</div>
        <div className="panel-sub">Track the progress and escalate if needed</div>
        <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
          {tickets.map(t => (
            <div key={t._id} className="job-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div><strong>{t.title}</strong> <span className="muted">({t.department} • {t.type})</span></div>
                  <div className="muted">Created: {new Date(t.createdAt).toLocaleString()}</div>
                </div>
                <div className="tag">{t.status}</div>
              </div>
              <div className="muted" style={{ marginTop: 6 }}>{t.description}</div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn secondary" onClick={() => resendToHigherAuthority(t._id)}>Resend to higher authority</button>
                <button className="btn secondary" onClick={() => toggleDetails(t._id)}>
                  {expanded[t._id] ? 'Hide details' : (loadingMap[t._id] ? 'Loading…' : 'View details')}
                </button>
              </div>
              {expanded[t._id] && (
                <div style={{ marginTop: 8, padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="sub" style={{ marginBottom: 6 }}>Status Timeline</div>
                  <ol style={{ position: 'relative', borderLeft: '1px solid rgba(255,255,255,0.12)', paddingLeft: 12, display: 'grid', gap: 8 }}>
                    {(details[t._id]?.history || []).slice().reverse().map((h, i) => (
                      <li key={i} className="sub" style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: -6.5, top: 6, width: 10, height: 10, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#8b5cf6)', border: '1px solid rgba(255,255,255,0.35)' }} />
                        <div style={{ fontSize: 12 }}>
                          <strong>{new Date(h.at || Date.now()).toLocaleString()}</strong>
                          {h.status ? ` • status: ${h.status}` : ''}
                          {h.routeStatus ? ` • routing: ${h.routeStatus}` : ''}
                          {h.assignedTo ? ` • assigned: ${String(h.assignedTo)}` : ''}
                          {h.escalated ? ' • escalated' : ''}
                          {h.comment ? ` • comment: ${h.comment}` : ''}
                        </div>
                      </li>
                    ))}
                    {!(details[t._id]?.history || []).length && (
                      <li className="sub">No history yet</li>
                    )}
                  </ol>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <input
                      placeholder="Add a comment"
                      value={newComment[t._id] || ''}
                      onChange={(e) => setNewComment((m) => ({ ...m, [t._id]: e.target.value }))}
                    />
                    <button className="btn" onClick={() => addComment(t._id)} disabled={!!postingMap[t._id]}>
                      {postingMap[t._id] ? 'Posting…' : 'Comment'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {!tickets.length && <div className="muted">No tickets yet</div>}
        </div>
      </section>
    </div>
  );
}
