import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth, requireRole } from '../middleware/auth.js';
import Application from '../models/Application.js';
import Candidate from '../models/Candidate.js';
import Resume from '../models/Resume.js';

const router = Router();

// POST /applications { jobId }
// Candidate applies to a job; we use their latest resume if available
router.post('/', requireAuth, requireRole('Candidate', 'Admin'), async (req, res) => {
  try {
    const { jobId } = req.body || {};
    if (!mongoose.isValidObjectId(jobId)) return res.status(400).json({ message: 'Invalid jobId' });

    // Find candidate record by userId
    const candidate = await Candidate.findOne({ userId: req.user.id });
    if (!candidate) return res.status(404).json({ message: 'Candidate profile not found' });

    const latestResume = await Resume.findOne({ candidateId: candidate._id }).sort({ createdAt: -1 });

    const app = await Application.create({
      candidateId: candidate._id,
      jobId,
      status: 'applied',
      resumeId: latestResume?._id,
      createdBy: req.user.id,
    });

    res.status(201).json(app);
  } catch (e) {
    res.status(500).json({ message: 'Failed to apply' });
  }
});

// GET /applications/me -> list applications of logged-in candidate
router.get('/me', requireAuth, requireRole('Candidate', 'Admin'), async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ userId: req.user.id });
    if (!candidate) return res.json([]);
    const apps = await Application.find({ candidateId: candidate._id }).sort({ createdAt: -1 }).limit(100);
    res.json(apps);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
});

export default router;
