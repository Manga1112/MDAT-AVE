import { useEffect, useState } from 'react';
import api from '../api/client';

export default function CandidatePortal() {
  const [candidate, setCandidate] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const upsertProfile = async (e) => {
    e?.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/candidates/me', { name, phone });
      setCandidate(data);
      setMessage('Profile saved');
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to save profile');
    }
  };

  const uploadResume = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!candidate?._id) return setError('Save profile first');
    if (!file) return setError('Select a file');
    try {
      const form = new FormData();
      form.append('resume', file);
      const { data } = await api.post(`/candidates/${candidate._id}/resume`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage(`Resume uploaded: ${Math.round((data.size || 0) / 1024)} KB`);
    } catch (e) {
      setError(e?.response?.data?.message || 'Upload failed');
    }
  };

  useEffect(() => {
    // Try to load profile on mount by saving what user typed
    upsertProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ maxWidth: 700, margin: '24px auto', padding: 16 }}>
      <h2>Candidate Portal</h2>
      {message && <div style={{ color: 'green' }}>{message}</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}

      <section style={{ margin: '16px 0' }}>
        <h3>Profile</h3>
        <form onSubmit={upsertProfile} style={{ display: 'grid', gap: 8 }}>
          <div>
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label>Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <button type="submit">Save Profile</button>
        </form>
      </section>

      <section style={{ margin: '16px 0' }}>
        <h3>Upload Resume (max 30KB)</h3>
        <form onSubmit={uploadResume}>
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <button type="submit" style={{ marginLeft: 8 }}>Upload</button>
        </form>
        <p style={{ fontSize: 12, color: '#666' }}>Allowed: PDF, DOCX, DOC, TXT</p>
      </section>
    </div>
  );
}
