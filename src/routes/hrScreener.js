import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth, requireRole } from '../middleware/auth.js';
import Job from '../models/Job.js';
import Candidate from '../models/Candidate.js';
import Resume from '../models/Resume.js';
import Screening from '../models/Screening.js';
import ScreeningJob from '../models/ScreeningJob.js';
import { screenResumeWithJD } from '../services/grokClient.js';

const router = Router();

function parseJobId(job_id) {
  if (!job_id) return null;
  // Accept either a Mongo ObjectId string or raw string id
  if (mongoose.isValidObjectId(job_id)) return new mongoose.Types.ObjectId(job_id);
  return null;
}

// GET /hr/screener/results?job_id=...
router.get('/results', requireAuth, requireRole('HR', 'Manager', 'Admin'), async (req, res) => {
  try {
    const jobId = parseJobId(req.query.job_id);
    if (!jobId) return res.json([]);
    const results = await Screening.find({ jobId }).sort({ createdAt: -1 }).limit(200).lean();
    const normalized = results.map(r => ({
      id: String(r._id),
      application_id: String(r._id),
      candidate_id: String(r.candidateId),
      candidate_name: undefined,
      overall_score: r.score ?? null,
      highlights: r.highlights || [],
      risks: r.gaps || [],
    }));
    res.json(normalized);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch results' });
  }
});

// POST /hr/screener/run { job_id, candidate_ids? (array) }
router.post('/run', requireAuth, requireRole('HR', 'Manager', 'Admin'), async (req, res) => {
  try {
    const { job_id, candidate_ids } = req.body || {};
    const jobId = parseJobId(job_id);
    if (!jobId) return res.status(400).json({ message: 'Invalid job_id' });
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // Pick candidates: if candidate_ids is provided, try using them, else find recent candidates with resumes
    let candidates = [];
    if (Array.isArray(candidate_ids) && candidate_ids.length) {
      const validIds = candidate_ids.filter((x) => mongoose.isValidObjectId(String(x))).map((x) => new mongoose.Types.ObjectId(String(x)));
      candidates = await Candidate.find({ _id: { $in: validIds } }).limit(20);
    } else {
      const recentResumes = await Resume.find({}).sort({ createdAt: -1 }).limit(10);
      const candIds = [...new Set(recentResumes.map(r => String(r.candidateId)))].slice(0, 10);
      candidates = await Candidate.find({ _id: { $in: candIds } });
    }

    // For each candidate, get latest resume and run screening
    for (const cand of candidates) {
      const resume = await Resume.findOne({ candidateId: cand._id }).sort({ createdAt: -1 });
      if (!resume) continue;

      try {
        // Lazy load parsers to avoid startup overhead
        const { openDownloadStream } = await import('../services/gridfs.js');
        const { parseResumeStream } = await import('../services/parser.js');
        const stream = openDownloadStream(resume.fileId);
        const resumeText = await parseResumeStream(stream, resume.contentType);

        const result = await screenResumeWithJD({ resumeText, jdText: job.jdText });
        await Screening.create({
          candidateId: cand._id,
          jobId: job._id,
          score: result.score,
          highlights: result.highlights,
          gaps: result.gaps,
          rationale: result.rationale,
          status: 'completed',
          model: 'grok-llm-sk-or-v1',
        });
      } catch (e) {
        await Screening.create({
          candidateId: cand._id,
          jobId: job._id,
          status: 'failed',
          error: e?.message || 'screening failed',
          model: 'grok-llm-sk-or-v1',
        });
      }
    }

    res.json({ message: 'Screening run completed' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to run screening' });
  }
});

// POST /hr/screener/enqueue { job_id }
router.post('/enqueue', requireAuth, requireRole('HR', 'Manager', 'Admin'), async (req, res) => {
  try {
    const { job_id } = req.body || {};
    const jobId = parseJobId(job_id);
    if (!jobId) return res.status(400).json({ message: 'Invalid job_id' });
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const total = await Resume.countDocuments({});
    const sj = await ScreeningJob.create({ jobId, status: 'queued', total, processed: 0, provider: 'grok' });

    // MVP: process synchronously and mark completed
    try {
      const resumes = await Resume.find({}).limit(10);
      let processed = 0;
      for (const r of resumes) {
        processed++;
      }
      sj.status = 'completed';
      sj.processed = processed;
      sj.token_usage = { total_tokens: 0, prompt_tokens: 0, completion_tokens: 0 };
      await sj.save();
    } catch (e) {
      sj.status = 'failed';
      sj.error = e?.message || 'failed processing';
      await sj.save();
    }

    res.status(201).json({ screening_job: { id: String(sj._id), status: sj.status, total: sj.total, processed: sj.processed, provider: sj.provider } });
  } catch (e) {
    res.status(500).json({ message: 'Failed to enqueue screening job' });
  }
});

// GET /hr/screener/job/:id
router.get('/job/:id', requireAuth, requireRole('HR', 'Manager', 'Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(404).json({ message: 'Not found' });
    const sj = await ScreeningJob.findById(id).lean();
    if (!sj) return res.status(404).json({ message: 'Not found' });
    res.json({ id: String(sj._id), status: sj.status, total: sj.total, processed: sj.processed, provider: sj.provider, token_usage: sj.token_usage });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch job' });
  }
});

export default router;
