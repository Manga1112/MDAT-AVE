import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth, requireRole } from '../middleware/auth.js';
import Approval from '../models/Approval.js';
import Ticket from '../models/Ticket.js';
import AuditLog from '../models/AuditLog.js';
import { notify } from '../services/notifier.js';

const router = Router();

// Approve/reject a ticket (HR or Manager)
router.post('/:ticketId', requireAuth, requireRole('HR', 'Manager', 'Admin'), async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status, comments } = req.body; // 'Approved' | 'Rejected'
    if (!mongoose.isValidObjectId(ticketId)) return res.status(400).json({ message: 'Invalid ticketId' });
    if (!['Approved', 'Rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const approval = await Approval.create({ ticketId, approverId: req.user.id, status, comments });

    const before = { status: ticket.status };
    ticket.status = status === 'Approved' ? 'Approved' : 'Rejected';
    ticket.history.push({ at: new Date(), by: req.user.id, approval: status });
    await ticket.save();

    await AuditLog.create({
      actorId: req.user.id,
      action: 'approval:decision',
      targetType: 'Ticket',
      targetId: String(ticket._id),
      before,
      after: { status: ticket.status },
    });

    // Notify requester and team about approval decision
    notify('ticket_approval_decision', {
      ticketId: String(ticket._id),
      status: ticket.status,
      approverId: req.user.id,
      comments: comments || '',
      department: ticket.department,
    });

    res.status(201).json({ approval, ticket });
  } catch (e) {
    res.status(500).json({ message: 'Approval failed' });
  }
});

export default router;
