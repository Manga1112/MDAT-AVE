import { useEffect, useState } from 'react';
import api from '../api/client';

export default function AdminDashboard() {
  // Filters
  const [qName, setQName] = useState('');
  const [qDept, setQDept] = useState('All');
  const [qFrom, setQFrom] = useState('');
  const [qTo, setQTo] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [sortCreated, setSortCreated] = useState('desc');
  // Toasts
  const [toasts, setToasts] = useState([]);
  const addToast = (variant, text) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, variant, text }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };

  // Modal state
  const [showNew, setShowNew] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [dept, setDept] = useState('IT');
  const [creating, setCreating] = useState(false);
  const [tempPwd, setTempPwd] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [search, setSearch] = useState('');
  useEffect(() => { setSearch(qName); }, []);
  useEffect(() => {
    const id = setTimeout(() => { setQName(search); /* trigger */ loadUsers(); }, 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const deptToRole = (d) => ({ IT: 'IT', HR: 'HR', Finance: 'Finance', Management: 'Manager' }[d] || 'Employee');

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (qName) params.name = qName;
      if (qDept && qDept !== 'All') params.dept = qDept;
      if (qFrom) params.from = qFrom;
      if (qTo) params.to = qTo;
      params.page = String(page);
      params.pageSize = String(pageSize);
      params.sortCreated = sortCreated;
      const { data } = await api.get('/admin/users', { params });
      if (Array.isArray(data)) {
        // backward-compat
        setUsers(data);
        setTotal(data.length);
      } else {
        setUsers(Array.isArray(data.items) ? data.items : []);
        setTotal(Number(data.total) || 0);
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); /* eslint-disable-next-line */ }, [page, pageSize, sortCreated]);

  const openNewUser = () => { setShowNew(true); setFullName(''); setEmail(''); setDept('IT'); setTempPwd(''); setMessage(''); setError(''); };

  const createUser = async (e) => {
    e?.preventDefault?.();
    setCreating(true);
    setError('');
    setMessage('');
    try {
      // Derive username from email before '@'
      // Validate
      if (!fullName.trim()) throw new Error('Full name is required');
      const emailVal = email.trim();
      const emailOk = /.+@.+\..+/.test(emailVal);
      if (!emailOk) throw new Error('Valid email is required');
      const uname = (emailVal || '').split('@')[0] || fullName.replace(/\s+/g, '').toLowerCase();
      const role = deptToRole(dept);
      // Generate a temporary password
      const pwd = Math.random().toString(36).slice(-8) + 'A!';
      const body = { username: uname, password: pwd, role, department: dept, email: emailVal, name: fullName.trim() };
      const { data } = await api.post('/admin/users', body);
      setTempPwd(pwd);
      setMessage(`Created ${data.username} (${data.role}). Temporary password: ${pwd}`);
      addToast('success', `User ${data.username} created`);
      setShowNew(false);
      await loadUsers();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to create user');
      addToast('error', e?.response?.data?.message || e?.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const resetFilters = async () => {
    setQName(''); setQDept('All'); setQFrom(''); setQTo(''); setPage(1); setSortCreated('desc');
    await loadUsers();
  };

  // Row actions
  const [editUser, setEditUser] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const onEdit = (u) => { setEditUser({ ...u }); };
  const onSaveEdit = async () => {
    if (!editUser?._id) return;
    setEditSaving(true); setError(''); setMessage('');
    try {
      const { _id, name, email, department, role, status } = editUser;
      if (email && !/.+@.+\..+/.test(email)) throw new Error('Enter a valid email');
      await api.patch(`/admin/users/${_id}`, { name, email, department, role, status });
      setEditUser(null);
      await loadUsers();
      setMessage('User updated');
      addToast('success', 'User updated');
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to update user');
      addToast('error', e?.response?.data?.message || e?.message || 'Failed to update user');
    } finally { setEditSaving(false); }
  };
  const onDisableToggle = async (u) => {
    try {
      const proceed = window.confirm(`${u.status === 'active' ? 'Disable' : 'Enable'} user ${u.username}?`);
      if (!proceed) return;
      await api.patch(`/admin/users/${u._id}`, { status: u.status === 'active' ? 'disabled' : 'active' });
      await loadUsers();
      const msg = `User ${u.username} ${u.status === 'active' ? 'disabled' : 'enabled'}`;
      setMessage(msg);
      addToast('success', msg);
    } catch (e) { 
      const msg = e?.response?.data?.message || 'Failed to update status';
      setError(msg); addToast('error', msg);
    }
  };
  const onDelete = async (u) => {
    if (!confirm(`Delete user ${u.username}?`)) return;
    try {
      await api.delete(`/admin/users/${u._id}`);
      await loadUsers();
      setMessage('User deleted');
      addToast('success', 'User deleted');
    } catch (e) { setError(e?.response?.data?.message || 'Failed to delete user'); }
  };

  const onResetPassword = async (u) => {
    const proceed = confirm(`Reset password for ${u.username}? This will email a temporary password.`);
    if (!proceed) return;
    try {
      const { data } = await api.post(`/admin/users/${u._id}/reset-password`);
      addToast('success', `Temporary password: ${data?.tempPassword || '(emailed)'}`);
    } catch (e) {
      addToast('error', e?.response?.data?.message || 'Failed to reset password');
    }
  };

  const exportCsv = () => {
    const headers = ['Name','Username','Email','Department','Role','Status','Created'];
    const rows = users.map(u => [
      JSON.stringify(u.name || ''),
      JSON.stringify(u.username || ''),
      JSON.stringify(u.email || ''),
      JSON.stringify(u.department || ''),
      JSON.stringify(u.role || ''),
      JSON.stringify(u.status || ''),
      JSON.stringify(u.createdAt ? new Date(u.createdAt).toISOString() : ''),
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `users_export_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container">
      {/* Header */}
      <div className="cp-header" style={{ marginTop: 8 }}>
        <div>
          <h2 style={{ margin: 0 }}>User Management</h2>
          <div className="muted">Create users, browse, and filter by department and date.</div>
        </div>
        <div>
          <button className="btn" onClick={openNewUser}>+ New User</button>
        </div>
      </div>

      {message && <div className="tag" style={{ marginBottom: 10 }}>{message}</div>}
      {error && <div className="tag" style={{ background: 'rgba(244,63,94,.25)', borderColor: 'rgba(244,63,94,.45)', marginBottom: 10 }}>{error}</div>}

      {/* Filters */}
      <section className="panel">
        <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Filters</span>
          <button className="btn secondary" onClick={()=>setShowFilters(v=>!v)}>{showFilters ? 'Hide' : 'Show'}</button>
        </div>
        {showFilters && (
        <>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: 10, marginTop: 8 }}>
          <div>
            <label>Name starts with</label>
            <input placeholder="e.g., Al" value={qName} onChange={(e) => setQName(e.target.value)} />
          </div>
          <div>
            <label>Department</label>
            <select value={qDept} onChange={(e) => setQDept(e.target.value)}>
              <option>All</option>
              <option>IT</option>
              <option>HR</option>
              <option>Finance</option>
              <option>Management</option>
              <option>Candidate</option>
              <option>Employee</option>
            </select>
          </div>
          <div>
            <label>Created from</label>
            <input type="date" value={qFrom} onChange={(e) => setQFrom(e.target.value)} />
          </div>
          <div>
            <label>Created to</label>
            <input type="date" value={qTo} onChange={(e) => setQTo(e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <button className="btn secondary" onClick={loadUsers}>Apply Filters</button>
          <button className="btn" style={{ marginLeft: 8 }} onClick={resetFilters}>Reset</button>
        </div>
        </>
        )}
      </section>

      {/* Users table */}
      <section className="panel" style={{ marginTop: 16 }}>
        <div className="panel-title toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span>Users ({total})</span>
          <div className="spacer" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input style={{ width: 220 }} placeholder="Quick search name/email" value={search} onChange={(e)=>setSearch(e.target.value)} />
            <label className="muted">Page size</label>
            <select value={pageSize} onChange={(e)=>{ setPageSize(parseInt(e.target.value)||10); setPage(1); }} style={{ width: 90 }}>
              <option>10</option>
              <option>20</option>
              <option>50</option>
            </select>
            <button className="btn" onClick={exportCsv}>Export CSV</button>
          </div>
        </div>
        <div className="table-wrap" style={{ marginTop: 8 }}>
          <table className="data">
            <thead>
              <tr className="muted">
                <th style={{ textAlign: 'left', padding: '8px 6px' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '8px 6px' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '8px 6px' }}>Department</th>
                <th style={{ textAlign: 'left', padding: '8px 6px', cursor: 'pointer' }} onClick={() => setSortCreated(s => s==='asc'?'desc':'asc')}>
                  Created {sortCreated === 'asc' ? '▲' : '▼'}
                </th>
                <th style={{ textAlign: 'left', padding: '8px 6px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td style={{ padding: '8px 6px' }}>{u.name || u.username}</td>
                  <td style={{ padding: '8px 6px' }}>{u.email || '-'}</td>
                  <td style={{ padding: '8px 6px' }}><span className={`tag tag-${String(u.department||'').toLowerCase()}`}>{u.department || '-'}</span></td>
                  <td style={{ padding: '8px 6px' }}>{u.createdAt ? new Date(u.createdAt).toLocaleString() : '-'}</td>
                  <td style={{ padding: '8px 6px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn secondary" onClick={()=>onEdit(u)}>Edit</button>
                      <button className="btn secondary" onClick={()=>onDisableToggle(u)}>{u.status === 'active' ? 'Disable' : 'Enable'}</button>
                      <button className="btn secondary" onClick={()=>onResetPassword(u)}>Reset Password</button>
                      <button className="btn" onClick={()=>onDelete(u)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!users.length && (
                <tr><td className="muted" colSpan={5} style={{ padding: '10px 6px' }}>{loading ? 'Loading…' : 'No users found'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <div className="muted">Page {page} of {Math.max(1, Math.ceil(total / pageSize))} • {total} users</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn secondary" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</button>
            <button className="btn" disabled={page>=Math.ceil(total/pageSize)} onClick={()=>setPage(p=>p+1)}>Next</button>
          </div>
        </div>
      </section>

      {/* Modal */}
      {showNew && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 50 }}>
          <div className="panel modal-panel" style={{ width: 420 }}>
            <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Create new user</span>
              <button className="btn secondary" onClick={() => setShowNew(false)}>✕</button>
            </div>
            <form onSubmit={createUser} style={{ display: 'grid', gap: 10, marginTop: 10 }}>
              <div>
                <label>Full name</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" required />
              </div>
              <div>
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@company.com" required />
              </div>
              <div>
                <label>Department</label>
                <select value={dept} onChange={(e) => setDept(e.target.value)}>
                  <option>IT</option>
                  <option>HR</option>
                  <option>Finance</option>
                  <option>Management</option>
                  <option>Candidate</option>
                  <option>Employee</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn secondary" onClick={() => setShowNew(false)}>Cancel</button>
                <button type="submit" className="btn" disabled={creating}>{creating ? 'Creating…' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 50 }}>
          <div className="panel modal-panel" style={{ width: 460 }}>
            <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Edit user</span>
              <button className="btn secondary" onClick={() => setEditUser(null)}>✕</button>
            </div>
            <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
              <div>
                <label>Full name</label>
                <input value={editUser.name || ''} onChange={(e)=>setEditUser(v=>({...v, name: e.target.value}))} />
              </div>
              <div>
                <label>Email</label>
                <input type="email" value={editUser.email || ''} onChange={(e)=>setEditUser(v=>({...v, email: e.target.value}))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label>Department</label>
                  <select value={editUser.department || ''} onChange={(e)=>setEditUser(v=>({...v, department: e.target.value}))}>
                    <option value="">(none)</option>
                    <option>IT</option>
                    <option>HR</option>
                    <option>Finance</option>
                    <option>Management</option>
                    <option>Candidate</option>
                    <option>Employee</option>
                  </select>
                </div>
                <div>
                  <label>Role</label>
                  <select value={editUser.role || 'Employee'} onChange={(e)=>setEditUser(v=>({...v, role: e.target.value}))}>
                    <option>Employee</option>
                    <option>IT</option>
                    <option>HR</option>
                    <option>Finance</option>
                    <option>Manager</option>
                    <option>Candidate</option>
                    <option>Admin</option>
                  </select>
                </div>
              </div>
              <div>
                <label>Status</label>
                <select value={editUser.status || 'active'} onChange={(e)=>setEditUser(v=>({...v, status: e.target.value}))}>
                  <option>active</option>
                  <option>disabled</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn secondary" onClick={()=>setEditUser(null)}>Cancel</button>
                <button className="btn" onClick={onSaveEdit} disabled={editSaving}>{editSaving ? 'Saving…' : 'Save'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.variant}`}>{t.text}</div>
        ))}
      </div>
    </div>
  );
}
