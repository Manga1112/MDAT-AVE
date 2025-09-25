import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Input, Button } from '../components/UI.jsx';

export default function Login() {
  const nav = useNavigate();
  const location = useLocation();
  const { setUser, setTokens } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [hintRole, setHintRole] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const role = p.get('role');
    if (role) setHintRole(role);
  }, [location.search]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/login', { username, password });
      setUser(data.user);
      setTokens(data.tokens);
      // Navigate by role
      switch (data.user.role) {
        case 'HR':
          nav('/hr');
          break;
        case 'IT':
          nav('/it');
          break;
        case 'Manager':
          nav('/manager');
          break;
        case 'Finance':
          nav('/finance');
          break;
        case 'Candidate':
          nav('/candidate');
          break;
        case 'Admin':
          nav('/admin');
          break;
        default:
          nav('/');
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <div className="card" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', padding: 18 }}>
        <div className="label">Login {hintRole ? `(${hintRole})` : ''}</div>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, marginTop: 12 }}>
          <Input label="Username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <div style={{ color: '#fecaca' }}>{error}</div>}
          <Button variant="primary" type="submit">Sign in</Button>
        </form>
      </div>
    </div>
  );
}
