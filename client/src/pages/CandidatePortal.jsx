import { useEffect, useState } from 'react';
import api from '../api/client';

export default function CandidatePortal() {
  const [candidate, setCandidate] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [jobs, setJobs] = useState([]);
  const [apps, setApps] = useState([]);
  const [applying, setApplying] = useState('');

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

  const loadJobs = async () => {
    try {
      const { data } = await api.get('/jobs/public');
      setJobs(data || []);
    } catch {
      // ignore
    }
  };

  const loadApplications = async () => {
    try {
      const { data } = await api.get('/applications/me');
      setApps(data || []);
    } catch {
      // ignore
    }
  };

  const applyToJob = async (jobId) => {
    if (!jobId) return;
    setError('');
    setApplying(jobId);
    try {
      await api.post('/applications', { jobId });
      setMessage('Applied successfully');
      await loadApplications();
    } catch (e) {
      setError(e?.response?.data?.message || 'Apply failed');
    } finally {
      setApplying('');
    }
  };

  useEffect(() => {
    // Try to load profile on mount by saving what user typed
    upsertProfile();
    loadJobs();
    loadApplications();
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

      <section style={{ margin: '16px 0' }}>
        <h3>Open Jobs</h3>
        <div style={{ display: 'grid', gap: 10 }}>
          {jobs.map((j) => (
            <div key={j._id} style={{ padding: 10, border: '1px solid rgba(0,0,0,0.2)', borderRadius: 8 }}>
              <div><strong>{j.title}</strong> <span className="sub">({j.department})</span></div>
              <div className="sub" style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{j.jdText?.slice(0, 240) || ''}{(j.jdText || '').length > 240 ? '…' : ''}</div>
              <div style={{ marginTop: 8 }}>
                <button disabled={!!applying} onClick={() => applyToJob(j._id)}>{applying === j._id ? 'Applying…' : 'Apply with my latest resume'}</button>
              </div>
            </div>
          ))}
          {!jobs.length && <div className="sub">No jobs available</div>}
        </div>
      </section>

      <section style={{ margin: '16px 0' }}>
        <h3>My Applications</h3>
        <div className="sub">Recent applications you have submitted.</div>
        <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          {apps.map((a) => (
            <div key={a._id} style={{ padding: 10, border: '1px solid rgba(0,0,0,0.2)', borderRadius: 8 }}>
              <div>Application #{a._id}</div>
              <div className="sub">Job: {a.jobId} • Status: {a.status}</div>
              <div className="sub">Created: {new Date(a.createdAt).toLocaleString()}</div>
            </div>
          ))}
          {!apps.length && <div className="sub">No applications yet</div>}
        </div>
      </section>
    </div>
  );
}
