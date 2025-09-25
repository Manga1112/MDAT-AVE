import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/auth.js';
import Ticket from '../models/Ticket.js';
import AuditLog from '../models/AuditLog.js';

const router = Router();

// Create ticket
router.post('/', requireAuth, async (req, res) => {
  try {
    const { department, type, title, description } = req.body;
    if (!department || !type || !title) return res.status(400).json({ message: 'Missing fields' });
    const ticket = await Ticket.create({ createdBy: req.user.id, department, type, title, description });
    await AuditLog.create({ actorId: req.user.id, action: 'ticket:create', targetType: 'Ticket', targetId: String(ticket._id) });
    res.status(201).json(ticket);
  } catch (e) {
    res.status(500).json({ message: 'Failed to create ticket' });
  }
});

// List tickets (filter by dept or creator)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { dept, mine } = req.query;
    const q = {};
    if (dept) q.department = dept;
    if (mine === 'true') q.createdBy = req.user.id;
    const tickets = await Ticket.find(q).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch tickets' });
  }
});

// Update status
router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Missing status' });
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Not found' });
    const before = { status: ticket.status };
    ticket.status = status;
    ticket.history.push({ at: new Date(), by: req.user.id, status });
    await ticket.save();
    await AuditLog.create({ actorId: req.user.id, action: 'ticket:update_status', targetType: 'Ticket', targetId: String(ticket._id), before, after: { status } });
    res.json(ticket);
  } catch (e) {
    res.status(500).json({ message: 'Failed to update status' });
  }
});

// Assign ticket
router.post('/:id/assign', requireAuth, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!mongoose.isValidObjectId(userId)) return res.status(400).json({ message: 'Invalid userId' });
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Not found' });
    const before = { assignedTo: ticket.assignedTo };
    ticket.assignedTo = userId;
    ticket.history.push({ at: new Date(), by: req.user.id, assignedTo: userId });
    await ticket.save();
    await AuditLog.create({ actorId: req.user.id, action: 'ticket:assign', targetType: 'Ticket', targetId: String(ticket._id), before, after: { assignedTo: userId } });
    res.json(ticket);
  } catch (e) {
    res.status(500).json({ message: 'Failed to assign ticket' });
  }
});

export default router;
