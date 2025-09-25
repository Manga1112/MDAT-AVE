import mongoose from 'mongoose';

const TicketSchema = new mongoose.Schema(
  {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    department: { type: String, enum: ['IT', 'HR', 'Finance'], required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    description: String,
    status: { type: String, enum: ['Created', 'PendingApproval', 'Approved', 'Rejected', 'InProgress', 'WaitingOnUser', 'Resolved', 'Closed'], default: 'Created' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    history: { type: [Object], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model('Ticket', TicketSchema);
