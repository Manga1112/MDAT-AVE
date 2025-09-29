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
    const { department, type, title, description, category, priority } = req.body;
    if (!department || !type || !title) return res.status(400).json({ message: 'Missing fields' });
    const ticket = await Ticket.create({ createdBy: req.user.id, department, type, title, description, category, priority });
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

// Get a single ticket with history
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const t = await Ticket.findById(req.params.id);
    if (!t) return res.status(404).json({ message: 'Not found' });
    // Authorize: requester or same department role can read; for simplicity, allow authenticated users
    res.json(t);
  } catch (e) {
    res.status(500).json({ message: 'Failed to load ticket' });
  }
});

// Add a comment to ticket history
router.post('/:id/comment', requireAuth, async (req, res) => {
  try {
    const { comment } = req.body || {};
    if (!comment || !String(comment).trim()) return res.status(400).json({ message: 'Comment is required' });
    const t = await Ticket.findById(req.params.id);
    if (!t) return res.status(404).json({ message: 'Not found' });
    t.history.push({ at: new Date(), by: req.user.id, comment: String(comment) });
    await t.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Failed to add comment' });
  }
});

// Escalate ticket: bump priority and optionally move into InProgress
router.post('/:id/escalate', requireAuth, async (req, res) => {
  try {
    const { note } = req.body || {};
    const t = await Ticket.findById(req.params.id);
    if (!t) return res.status(404).json({ message: 'Not found' });
    const before = { priority: t.priority, status: t.status };
    t.priority = 'urgent';
    if (t.status === 'Created' || t.status === 'PendingApproval') {
      t.status = 'InProgress';
    }
    t.history.push({ at: new Date(), by: req.user.id, escalated: true, note: note || '' });
    await t.save();
    // Notify requester and department leads
    const requester = await User.findById(t.createdBy).lean();
    const teamEnv = t.department === 'IT' ? process.env.IT_TEAM_EMAIL : t.department === 'HR' ? process.env.HR_TEAM_EMAIL : t.department === 'Finance' ? process.env.FINANCE_TEAM_EMAIL : '';
    const recipients = [requester?.email, teamEnv].filter(Boolean);
    notify('ticket_escalated', {
      ticketId: String(t._id),
      department: t.department,
      by: req.user.id,
      to: recipients,
    });
    await AuditLog.create({ actorId: req.user.id, action: 'ticket:escalate', targetType: 'Ticket', targetId: String(t._id), before, after: { priority: t.priority, status: t.status } });
    res.json(t);
  } catch (e) {
    res.status(500).json({ message: 'Failed to escalate' });
  }
});

// List tickets (filters + pagination)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { dept, mine, status, routeStatus, assignedTo, category, priority, search, page = '1', pageSize = '20' } = req.query;
    const q = {};
    if (dept) q.department = dept;
    if (mine === 'true') q.createdBy = req.user.id;
    if (status) q.status = status;
    if (routeStatus) q.routeStatus = routeStatus;
    if (assignedTo) q.assignedTo = assignedTo;
    if (category) q.category = category;
    if (priority) q.priority = priority;
    if (search) {
      q.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
      ];
    }
    const pg = Math.max(parseInt(page, 10) || 1, 1);
    const ps = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);
    const total = await Ticket.countDocuments(q);
    const items = await Ticket.find(q).sort({ createdAt: -1 }).skip((pg - 1) * ps).limit(ps);
    res.json({ items, total, page: pg, pageSize: ps });
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

// Route ticket (mark as routed with optional notes)
router.post('/:id/route', requireAuth, async (req, res) => {
  try {
    const { notes } = req.body;
    const t = await Ticket.findById(req.params.id);
    if (!t) return res.status(404).json({ message: 'Not found' });
    t.routeStatus = 'routed';
    t.routedBy = req.user.id;
    t.routedAt = new Date();
    if (notes) t.routingNotes = notes;
    t.history.push({ at: new Date(), by: req.user.id, routeStatus: 'routed', notes });
    await t.save();
    res.json(t);
  } catch (e) {
    res.status(500).json({ message: 'Failed to route ticket' });
  }
});

// Auto-route: choose an IT member with lowest active load and assign
router.post('/:id/autoroute', requireAuth, async (req, res) => {
  try {
    const t = await Ticket.findById(req.params.id);
    if (!t) return res.status(404).json({ message: 'Not found' });
    if (t.department !== 'IT') return res.status(400).json({ message: 'Only IT tickets can be auto-routed' });
    const team = await User.find({ department: 'IT', status: 'active' }, { passwordHash: 0 }).lean();
    if (!team.length) return res.status(400).json({ message: 'No IT team members found' });
    // compute load
    const loads = await Promise.all(team.map(async (u) => ({
      user: u,
      count: await Ticket.countDocuments({ department: 'IT', assignedTo: u._id, status: { $nin: ['Resolved', 'Closed'] } }),
    })));
    loads.sort((a, b) => a.count - b.count);
    const pick = loads[0].user;
    const before = { assignedTo: t.assignedTo };
    t.assignedTo = pick._id;
    t.routeStatus = 'routed';
    t.routedBy = req.user.id;
    t.routedAt = new Date();
    t.history.push({ at: new Date(), by: req.user.id, assignedTo: pick._id, routeStatus: 'routed', auto: true });
    await t.save();
    await AuditLog.create({ actorId: req.user.id, action: 'ticket:autoroute', targetType: 'Ticket', targetId: String(t._id), before, after: { assignedTo: pick._id, routeStatus: 'routed' } });
    res.json(t);
  } catch (e) {
    res.status(500).json({ message: 'Failed to auto-route ticket' });
  }
});

// Summary counts (e.g., for cards): pending, routed, working, resolved
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const { dept = 'IT' } = req.query;
    const [pending, routed, working, resolved] = await Promise.all([
      Ticket.countDocuments({ department: dept, status: 'Created' }),
      Ticket.countDocuments({ department: dept, routeStatus: 'routed' }),
      Ticket.countDocuments({ department: dept, status: 'InProgress' }),
      Ticket.countDocuments({ department: dept, status: 'Resolved' }),
    ]);
    res.json({ pending, routed, working, resolved });
  } catch (e) {
    res.status(500).json({ message: 'Failed to load summary' });
  }
});

// Team overview: members and their active loads
router.get('/team', requireAuth, async (req, res) => {
  try {
    const { dept = 'IT' } = req.query;
    const members = await User.find({ department: dept, status: 'active' }, { passwordHash: 0 }).lean();
    const withCounts = await Promise.all(members.map(async (m) => ({
      ...m,
      openTickets: await Ticket.countDocuments({ department: dept, assignedTo: m._id, status: { $nin: ['Resolved', 'Closed'] } }),
    })));
    res.json(withCounts);
  } catch (e) {
    res.status(500).json({ message: 'Failed to load team' });
  }
});

export default router;
