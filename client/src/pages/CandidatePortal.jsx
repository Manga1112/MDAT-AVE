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
    <div className="container">
      <div className="cp-header">
        <div>
          <h2 style={{ margin: 0 }}>Candidate Portal</h2>
          <div className="muted">Manage your profile, upload resume, browse JDs and apply</div>
        </div>
        <div>
          {message && <span className="tag" style={{ marginRight: 8 }}>{message}</span>}
          {error && <span className="tag" style={{ background: 'rgba(244,63,94,.25)', borderColor: 'rgba(244,63,94,.45)' }}>{error}</span>}
        </div>
      </div>

      <div className="cp-grid">
        <div className="panel">
          <div className="panel-title">Profile</div>
          <div className="panel-sub">Keep your contact information up to date</div>
          <form onSubmit={upsertProfile} style={{ display: 'grid', gap: 10, marginTop: 10 }}>
            <div>
              <label>Name</label>
              <input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label>Phone</label>
              <input placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn" type="submit">Save Profile</button>
              {candidate?._id && <span className="muted">Candidate ID: {candidate._id}</span>}
            </div>
          </form>
        </div>

        <div className="panel">
          <div className="panel-title">Resume</div>
          <div className="panel-sub">Upload a resume (max 30KB). PDF, DOCX, DOC, or TXT</div>
          <form onSubmit={uploadResume} style={{ display: 'flex', gap: 10, marginTop: 10, alignItems: 'center' }}>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <button className="btn secondary" type="submit">Upload</button>
          </form>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel-title">Open Jobs</div>
        <div className="panel-sub">Browse and apply with your latest resume</div>
        <div style={{ display: 'grid', gap: 12, marginTop: 10 }}>
          {jobs.map((j) => (
            <div key={j._id} className="job-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{j.title} <span className="muted">({j.department})</span></div>
                  <div className="muted" style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{j.jdText?.slice(0, 220) || ''}{(j.jdText || '').length > 220 ? '…' : ''}</div>
                </div>
                <div>
                  <button className="btn" disabled={!!applying} onClick={() => applyToJob(j._id)}>
                    {applying === j._id ? 'Applying…' : 'Apply Now'}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!jobs.length && <div className="muted">No jobs available</div>}
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel-title">My Applications</div>
        <div className="panel-sub">Track your recent applications</div>
        <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
          {apps.map((a) => (
            <div key={a._id} className="job-item">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div><strong>Application</strong> #{a._id}</div>
                  <div className="muted">Job: {a.jobId}</div>
                </div>
                <div className="tag">{a.status}</div>
              </div>
              <div className="muted" style={{ marginTop: 6 }}>Created: {new Date(a.createdAt).toLocaleString()}</div>
            </div>
          ))}
          {!apps.length && <div className="muted">No applications yet</div>}
        </div>
      </div>
    </div>
  );
}
