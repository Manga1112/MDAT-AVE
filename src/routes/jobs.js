import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import Job from '../models/Job.js';

const router = Router();

// Create job (HR or IT or Manager)
router.post('/', requireAuth, requireRole('HR', 'IT', 'Manager', 'Admin'), async (req, res) => {
  try {
    const { title, department, jdText, requirements = [] } = req.body;
    if (!title || !department || !jdText) return res.status(400).json({ message: 'Missing fields' });
    const job = await Job.create({ title, department, jdText, requirements });
    res.status(201).json(job);
  } catch (e) {
    res.status(500).json({ message: 'Failed to create job' });
  }
});

// List jobs
router.get('/', requireAuth, async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
});

// Get job by id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Not found' });
    res.json(job);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch job' });
  }
});

export default router;
