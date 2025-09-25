import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

const ROLE_TO_DEFAULT_DEPT = {
  Admin: null,
  HR: 'HR',
  IT: 'IT',
  Manager: 'Management',
  Finance: 'Finance',
  Candidate: 'Candidate',
};

// Admin creates staff accounts
router.post('/users', requireAuth, requireRole('Admin'), async (req, res) => {
  try {
    const { username, password, role, department, email } = req.body;
    if (!username || !password || !role) return res.status(400).json({ message: 'Missing fields' });

    // Validate role
    if (!Object.keys(ROLE_TO_DEFAULT_DEPT).includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const exists = await User.findOne({ username });
    if (exists) return res.status(409).json({ message: 'Username already in use' });
    const passwordHash = await bcrypt.hash(password, 10);

    // Normalize department: prefer provided one if valid, else default by role
    let dept = department;
    if (typeof dept === 'string') {
      // Normalize common variations
      const norm = dept.trim().toLowerCase();
      if (['it','hr','finance','management','manager','candidate'].includes(norm)) {
        dept = {
          it: 'IT',
          hr: 'HR',
          finance: 'Finance',
          management: 'Management',
          manager: 'Management',
          candidate: 'Candidate',
        }[norm];
      } else {
        // Unknown department, fallback to default by role
        dept = ROLE_TO_DEFAULT_DEPT[role];
      }
    } else if (dept == null) {
      dept = ROLE_TO_DEFAULT_DEPT[role];
    }

    const user = await User.create({ username, email, passwordHash, role, department: dept });
    res.status(201).json({ id: user._id, username: user.username, role: user.role });
  } catch (e) {
    // Surface validation errors where possible
    const msg = e?.message?.includes('`department` is invalid')
      ? 'Invalid department for user'
      : (e?.message || 'Failed to create user');
    res.status(500).json({ message: msg });
  }
});

export default router;
