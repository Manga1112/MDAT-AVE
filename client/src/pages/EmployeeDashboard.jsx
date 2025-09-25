import { useEffect, useState } from 'react';
import api from '../api/client';

export default function EmployeeDashboard() {
  const [projects, setProjects] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [dept, setDept] = useState('IT');
  const [type, setType] = useState('Issue');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projCreating, setProjCreating] = useState(false);

  const loadTickets = async () => {
    try {
      const { data } = await api.get('/tickets', { params: { mine: 'true' } });
      setTickets(data || []);
    } catch (e) {
      setError('Failed to load tickets');
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
      const { data } = await api.post('/tickets', { department: dept, type, title, description });
      setMessage(`Ticket #${data._id} created`);
      setTitle('');
      setDescription('');
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
    // Placeholder action: we simulate escalation by setting status to "Escalated"
    // and in a real system, send emails/notifications here.
    try {
      await api.patch(`/tickets/${ticketId}/status`, { status: 'Escalated' });
      setMessage(`Ticket #${ticketId} escalated to higher authority`);
      await loadTickets();
      // TODO: Integrate email automation service (e.g., SendGrid) here
      // console.log('Email sent to approvers for escalation');
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
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <button className="btn secondary" onClick={() => resendToHigherAuthority(t._id)}>Resend to higher authority</button>
              </div>
            </div>
          ))}
          {!tickets.length && <div className="muted">No tickets yet</div>}
        </div>
      </section>
    </div>
  );
}
