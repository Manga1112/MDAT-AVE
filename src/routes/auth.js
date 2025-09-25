import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { env } from '../config/env.js';

const router = Router();

function signTokens(user) {
  const access = jwt.sign({ id: user._id, role: user.role, username: user.username }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
  const refresh = jwt.sign({ id: user._id, role: user.role, username: user.username, type: 'refresh' }, env.jwtSecret, { expiresIn: env.jwtRefreshExpiresIn });
  return { access, refresh };
}

// Public candidate registration using username + password (email optional)
router.post('/register', async (req, res) => {
  try {
    const { username, password, email, name, phone } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username and password required' });
    const exists = await User.findOne({ username });
    if (exists) return res.status(409).json({ message: 'Username already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, passwordHash, role: 'Candidate', department: 'Candidate' });
    // Optionally create Candidate profile
    const tokens = signTokens(user);
    res.status(201).json({ user: { id: user._id, username: user.username, role: user.role }, tokens });
  } catch (e) {
    res.status(500).json({ message: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const tokens = signTokens(user);
    res.json({ user: { id: user._id, username: user.username, role: user.role }, tokens });
  } catch (e) {
    res.status(500).json({ message: 'Login failed' });
  }
});

router.post('/refresh', async (req, res) => {
  const { refresh } = req.body;
  if (!refresh) return res.status(400).json({ message: 'Missing refresh token' });
  try {
    const payload = jwt.verify(refresh, env.jwtSecret);
    if (payload.type !== 'refresh') throw new Error('invalid');
    const tokens = signTokens({ _id: payload.id, role: payload.role, username: payload.username });
    res.json(tokens);
  } catch (e) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

export default router;
