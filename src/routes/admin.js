import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { notify } from '../services/notifier.js';

const router = Router();

const ROLE_TO_DEFAULT_DEPT = {
  Admin: null,
  HR: 'HR',
  IT: 'IT',
  Manager: 'Management',
  Finance: 'Finance',
  Candidate: 'Candidate',
  Employee: 'Employee',
};

// Admin creates staff accounts
router.post('/users', requireAuth, requireRole('Admin'), async (req, res) => {
  try {
    const { username, password, role, department, email, name } = req.body;
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

    const user = await User.create({ username, email, passwordHash, role, department: dept, name });
    res.status(201).json({ id: user._id, username: user.username, role: user.role, department: dept, email: user.email, createdAt: user.createdAt });
  } catch (e) {
    // Surface validation errors where possible
    const msg = e?.message?.includes('`department` is invalid')
      ? 'Invalid department for user'
      : (e?.message || 'Failed to create user');
    res.status(500).json({ message: msg });
  }
});

// List users with optional filters
// Query: name (prefix), dept, from (ISO), to (ISO)
router.get('/users', requireAuth, requireRole('Admin'), async (req, res) => {
  try {
    const { name, dept, from, to, page = '1', pageSize = '10', sortCreated = 'desc' } = req.query;
    const q = {};
    if (name) q.$or = [
      { username: { $regex: '^' + String(name), $options: 'i' } },
      { name: { $regex: '^' + String(name), $options: 'i' } },
      { email: { $regex: '^' + String(name), $options: 'i' } },
    ];
    if (dept && dept !== 'All') q.department = dept;
    if (from || to) {
      q.createdAt = {};
      if (from) q.createdAt.$gte = new Date(from);
      if (to) q.createdAt.$lte = new Date(to);
    }
    const pg = Math.max(parseInt(page, 10) || 1, 1);
    const ps = Math.min(Math.max(parseInt(pageSize, 10) || 10, 1), 100);
    const sort = { createdAt: String(sortCreated).toLowerCase() === 'asc' ? 1 : -1 };
    const total = await User.countDocuments(q);
    const items = await User.find(q, { passwordHash: 0 }).sort(sort).skip((pg - 1) * ps).limit(ps);
    res.json({ items, total, page: pg, pageSize: ps });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Update user (name, email, department, status)
router.patch('/users/:id', requireAuth, requireRole('Admin'), async (req, res) => {
  try {
    const { name, email, department, status, role } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (email !== undefined) update.email = email;
    if (department !== undefined) update.department = department || null;
    if (status !== undefined) update.status = status;
    if (role !== undefined) update.role = role;
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, projection: { passwordHash: 0 } });
    if (!user) return res.status(404).json({ message: 'Not found' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:id', requireAuth, requireRole('Admin'), async (req, res) => {
  try {
    const u = await User.findByIdAndDelete(req.params.id);
    if (!u) return res.status(404).json({ message: 'Not found' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Reset password and email temporary password
router.post('/users/:id/reset-password', requireAuth, requireRole('Admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    const temp = Math.random().toString(36).slice(-8) + 'A!';
    const passwordHash = await bcrypt.hash(temp, 10);
    user.passwordHash = passwordHash;
    await user.save();
    // email the user if email exists
    if (user.email) {
      notify('user_password_reset', {
        userId: String(user._id),
        username: user.username,
        email: user.email,
        tempPassword: temp,
        to: [user.email],
      });
    }
    res.json({ ok: true, tempPassword: temp });
  } catch (e) {
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

export default router;
