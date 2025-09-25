import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth, requireRole } from '../middleware/auth.js';
import Offer from '../models/Offer.js';

const router = Router();

// GET /offers?candidateId=&jobId=
router.get('/', requireAuth, requireRole('HR', 'Finance', 'Manager', 'Admin'), async (req, res) => {
  try {
    const { candidateId, jobId } = req.query;
    const q = {};
    if (candidateId && mongoose.isValidObjectId(candidateId)) q.candidateId = candidateId;
    if (jobId && mongoose.isValidObjectId(jobId)) q.jobId = jobId;
    const items = await Offer.find(q).sort({ createdAt: -1 }).limit(100);
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch offers' });
  }
});

// POST /offers { candidateId, jobId, salary, currency, startDate, notes }
router.post('/', requireAuth, requireRole('HR', 'Manager', 'Admin'), async (req, res) => {
  try {
    const { candidateId, jobId, salary, currency, startDate, notes } = req.body || {};
    if (!candidateId || !jobId) return res.status(400).json({ message: 'candidateId and jobId required' });
    const o = await Offer.create({ candidateId, jobId, salary, currency, startDate, notes, createdBy: req.user.id });
    res.status(201).json(o);
  } catch (e) {
    res.status(500).json({ message: 'Failed to create offer' });
  }
});

// PATCH /offers/:id { status, salary, startDate, notes }
router.patch('/:id', requireAuth, requireRole('HR', 'Finance', 'Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(404).json({ message: 'Not found' });
    const o = await Offer.findById(id);
    if (!o) return res.status(404).json({ message: 'Not found' });
    const { status, salary, startDate, notes } = req.body || {};
    if (status) o.status = status;
    if (salary != null) o.salary = salary;
    if (startDate) o.startDate = startDate;
    if (notes != null) o.notes = notes;
    await o.save();
    res.json(o);
  } catch (e) {
    res.status(500).json({ message: 'Failed to update offer' });
  }
});

export default router;
