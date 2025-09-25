import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import Project from '../models/Project.js';

const router = Router();

// GET /projects?mine=true -> list my projects
router.get('/', requireAuth, async (req, res) => {
  try {
    const { mine } = req.query;
    const q = {};
    if (mine === 'true') q.ownerId = req.user.id;
    const projects = await Project.find(q).sort({ createdAt: -1 });
    res.json(projects);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
});

// POST /projects -> create a project owned by current user
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, description, status } = req.body;
    if (!name) return res.status(400).json({ message: 'Missing name' });
    const project = await Project.create({ ownerId: req.user.id, name, description: description || '', status: status || 'In Progress' });
    res.status(201).json(project);
  } catch (e) {
    res.status(500).json({ message: 'Failed to create project' });
  }
});

export default router;
