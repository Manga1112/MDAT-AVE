import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth, requireRole } from '../middleware/auth.js';
import Screening from '../models/Screening.js';
import Resume from '../models/Resume.js';
import Candidate from '../models/Candidate.js';
import Job from '../models/Job.js';
import { screenResumeWithJD } from '../services/grokClient.js';

const router = Router();

// List screenings
router.get('/', requireAuth, requireRole('HR', 'IT', 'Manager', 'Admin'), async (req, res) => {
  try {
    const { jobId, candidateId } = req.query;
    const q = {};
    if (jobId && mongoose.isValidObjectId(jobId)) q.jobId = jobId;
    if (candidateId && mongoose.isValidObjectId(candidateId)) q.candidateId = candidateId;
    const screenings = await Screening.find(q).sort({ createdAt: -1 }).limit(100);
    res.json(screenings);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch screenings' });
  }
});

// Trigger screening for candidate against a job
router.post('/run', requireAuth, requireRole('HR', 'IT', 'Manager'), async (req, res) => {
  try {
    const { candidateId, jobId } = req.body;
    if (!mongoose.isValidObjectId(candidateId) || !mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({ message: 'Invalid ids' });
    }
    const [cand, job, resume] = await Promise.all([
      Candidate.findById(candidateId),
      Job.findById(jobId),
      Resume.findOne({ candidateId }).sort({ createdAt: -1 }),
    ]);
    if (!cand || !job || !resume) return res.status(404).json({ message: 'Candidate, job, or resume not found' });

    const screening = await Screening.create({ candidateId, jobId, status: 'queued', model: 'grok-llm-sk-or-v1' });

    // Lazy load parser and gridfs to avoid loading pdf parsers at startup
    const { openDownloadStream } = await import('../services/gridfs.js');
    const { parseResumeStream } = await import('../services/parser.js');

    // Parse resume text from GridFS
    let resumeText = resume.parsedText || '';
    if (!resumeText) {
      const stream = openDownloadStream(resume.fileId);
      resumeText = await parseResumeStream(stream, resume.contentType);
      // store parsed text for reuse
      resume.parsedText = resumeText;
      await resume.save();
    }

    const result = await screenResumeWithJD({ resumeText, jdText: job.jdText });

    screening.score = result.score;
    screening.highlights = result.highlights;
    screening.gaps = result.gaps;
    screening.rationale = result.rationale;
    screening.status = 'completed';
    await screening.save();

    res.status(201).json(screening);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Screening failed' });
  }
});

export default router;
