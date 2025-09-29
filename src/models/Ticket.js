import mongoose from 'mongoose';

const TicketSchema = new mongoose.Schema(
  {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    department: { type: String, enum: ['IT', 'HR', 'Finance'], required: true },
    type: { type: String, required: true },
    category: { type: String, default: 'other' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    title: { type: String, required: true },
    description: String,
    status: { type: String, enum: ['Created', 'PendingApproval', 'Approved', 'Rejected', 'InProgress', 'WaitingOnUser', 'Resolved', 'Closed'], default: 'Created' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    routeStatus: { type: String, enum: ['unrouted', 'routed'], default: 'unrouted' },
    routedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    routedAt: { type: Date },
    routingNotes: { type: String },
    history: { type: [Object], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model('Ticket', TicketSchema);
