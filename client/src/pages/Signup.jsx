import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('username', username);
      formData.append('password', password);
      if (file) formData.append('resume', file);

      await api.post('/auth/register', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      nav('/login');
    } catch (e) {
      setError(e?.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <div className="card" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', padding: 18 }}>
        <div className="label">Candidate Signup</div>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, marginTop: 12 }}>
          <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files[0])} />
          {error && <div style={{ color: '#fecaca' }}>{error}</div>}
          <button className="btn" type="submit" disabled={loading}>{loading ? 'Signing up...' : 'Sign Up'}</button>
        </form>
      </div>
    </div>
  );
}
