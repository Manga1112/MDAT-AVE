import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import Candidate from '../models/Candidate.js';
import Screening from '../models/Screening.js';
import Job from '../models/Job.js';
import Ticket from '../models/Ticket.js';
import Approval from '../models/Approval.js';

const router = Router();

// HR dashboard: pipeline counts, latest screenings
router.get('/hr', requireAuth, requireRole('HR', 'Manager', 'Admin'), async (req, res) => {
  try {
    const pipelineStages = ['Applied', 'Screened', 'Interviewed', 'Shortlisted', 'Offer', 'Hired', 'Rejected'];
    const pipelineCounts = {};
    for (const stage of pipelineStages) {
      pipelineCounts[stage] = await Candidate.countDocuments({ 'stages.0.name': stage });
    }

    const latestScreenings = await Screening.find().sort({ createdAt: -1 }).limit(20);

    res.json({ pipelineCounts, latestScreenings });
  } catch (e) {
    res.status(500).json({ message: 'Failed to load HR dashboard' });
  }
});

// IT dashboard: system proxy metrics from DB approximations
router.get('/it', requireAuth, requireRole('IT', 'Admin'), async (req, res) => {
  try {
    const openTickets = await Ticket.countDocuments({ department: 'IT', status: { $in: ['Created', 'InProgress', 'PendingApproval', 'Approved'] } });
    const screeningStats = {
      total: await Screening.countDocuments(),
      completed: await Screening.countDocuments({ status: 'completed' }),
      failed: await Screening.countDocuments({ status: 'failed' }),
    };
    res.json({ systemHealth: { api: 'ok' }, screeningStats, openTickets });
  } catch (e) {
    res.status(500).json({ message: 'Failed to load IT dashboard' });
  }
});

// Manager dashboard: candidate pipeline view (screened -> shortlisted)
router.get('/manager', requireAuth, requireRole('Manager', 'HR', 'Admin'), async (req, res) => {
  try {
    const screened = await Candidate.find({ 'stages.name': 'Screened' }).limit(50);
    const interviewed = await Candidate.find({ 'stages.name': 'Interviewed' }).limit(50);
    const shortlisted = await Candidate.find({ 'stages.name': 'Shortlisted' }).limit(50);
    res.json({ screened, interviewed, shortlisted });
  } catch (e) {
    res.status(500).json({ message: 'Failed to load Manager dashboard' });
  }
});

// Finance dashboard: open offers (jobs) and approvals
router.get('/finance', requireAuth, requireRole('Finance', 'Admin'), async (req, res) => {
  try {
    const openJobs = await Job.find({ status: 'open' }).countDocuments();
    const pendingApprovals = await Approval.countDocuments({ status: 'Pending' });
    res.json({ openJobs, pendingApprovals });
  } catch (e) {
    res.status(500).json({ message: 'Failed to load Finance dashboard' });
  }
});

export default router;
