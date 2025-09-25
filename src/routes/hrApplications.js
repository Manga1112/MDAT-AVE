import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import Candidate from '../models/Candidate.js';
import Resume from '../models/Resume.js';

const router = Router();

// GET /hr/applications
// Returns candidates that have at least one resume uploaded, with latest resume metadata
router.get('/', requireAuth, requireRole('HR', 'Manager', 'Admin'), async (req, res) => {
  try {
    // Find latest resume per candidate
    const latestPerCandidate = await Resume.aggregate([
      { $sort: { candidateId: 1, createdAt: -1 } },
      { $group: { _id: '$candidateId', latest: { $first: '$$ROOT' } } },
      { $limit: 100 },
    ]);
    const candidateIds = latestPerCandidate.map((r) => r._id);
    const candidates = await Candidate.find({ _id: { $in: candidateIds } }).lean();
    const map = Object.fromEntries(candidates.map((c) => [String(c._id), c]));
    const items = latestPerCandidate.map(({ _id, latest }) => ({
      candidateId: String(_id),
      candidateName: map[String(_id)]?.name || 'Unknown',
      candidateEmail: map[String(_id)]?.email || '-',
      resumeId: String(latest._id),
      resumeFilename: latest.filename,
      resumeUploadedAt: latest.createdAt,
    }));
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: 'Failed to load applications' });
  }
});

export default router;
