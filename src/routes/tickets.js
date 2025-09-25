import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/auth.js';
import Ticket from '../models/Ticket.js';
import AuditLog from '../models/AuditLog.js';
import { notify } from '../services/notifier.js';
import User from '../models/User.js';

const router = Router();

// Create ticket
router.post('/', requireAuth, async (req, res) => {
  try {
    const { department, type, title, description } = req.body;
    if (!department || !type || !title) return res.status(400).json({ message: 'Missing fields' });
    const ticket = await Ticket.create({ createdBy: req.user.id, department, type, title, description });
    await AuditLog.create({ actorId: req.user.id, action: 'ticket:create', targetType: 'Ticket', targetId: String(ticket._id) });
    // Notify requester and team based on department
    const requester = await User.findById(req.user.id).lean();
    const teamEnv = department === 'IT' ? process.env.IT_TEAM_EMAIL : department === 'HR' ? process.env.HR_TEAM_EMAIL : department === 'Finance' ? process.env.FINANCE_TEAM_EMAIL : '';
    const recipients = [requester?.email, teamEnv].filter(Boolean);
    notify('ticket_created', {
      ticketId: String(ticket._id),
      department,
      title,
      createdBy: req.user.id,
      to: recipients,
    });
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
    const { status, comment } = req.body;
    if (!status) return res.status(400).json({ message: 'Missing status' });
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Not found' });
    const before = { status: ticket.status };
    ticket.status = status;
    ticket.history.push({ at: new Date(), by: req.user.id, status, comment });
    await ticket.save();
    await AuditLog.create({ actorId: req.user.id, action: 'ticket:update_status', targetType: 'Ticket', targetId: String(ticket._id), before, after: { status } });
    // Notify requester and team of status change
    const requester = await User.findById(ticket.createdBy).lean();
    const teamEnv = ticket.department === 'IT' ? process.env.IT_TEAM_EMAIL : ticket.department === 'HR' ? process.env.HR_TEAM_EMAIL : ticket.department === 'Finance' ? process.env.FINANCE_TEAM_EMAIL : '';
    const recipients = [requester?.email, teamEnv].filter(Boolean);
    notify('ticket_status_changed', {
      ticketId: String(ticket._id),
      status,
      department: ticket.department,
      updatedBy: req.user.id,
      comment: comment || '',
      to: recipients,
    });
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
