import { useEffect, useState } from 'react';
import api from '../api/client';

export default function AdminDashboard() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('HR');
  const [department, setDepartment] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const ROLE_TO_DEFAULT_DEPT = {
    Admin: '',
    HR: 'HR',
    IT: 'IT',
    Manager: 'Management',
    Finance: 'Finance',
    Candidate: 'Candidate',
    Employee: '',
  };

  useEffect(() => {
    setDepartment(ROLE_TO_DEFAULT_DEPT[role] || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const onCreate = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const { data } = await api.post('/admin/users', { username, password, role, department });
      setMessage(`Created user ${data.username} (${data.role})`);
      setUsername('');
      setPassword('');
      setDepartment('');
      setRole('HR');
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to create user');
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '24px auto', padding: 16 }}>
      <h2>Admin Dashboard</h2>
      {message && <div style={{ color: 'green' }}>{message}</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}

      <section>
        <h3>Create User</h3>
        <form onSubmit={onCreate} style={{ display: 'grid', gap: 8 }}>
          <div>
            <label>Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g., hr1" required />
          </div>
          <div>
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div>
            <label>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option>HR</option>
              <option>IT</option>
              <option>Manager</option>
              <option>Finance</option>
              <option>Candidate</option>
              <option>Employee</option>
              <option>Admin</option>
            </select>
          </div>
          <div>
            <label>Department</label>
            <select value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="">(none)</option>
              <option value="IT">IT</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
              <option value="Management">Management</option>
              <option value="Candidate">Candidate</option>
            </select>
            <div className="sub">Defaults based on role. You can override.</div>
          </div>
          <button type="submit">Create</button>
        </form>
      </section>
    </div>
  );
}
