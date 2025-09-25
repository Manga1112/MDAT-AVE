import mongoose from 'mongoose';

const ApprovalSchema = new mongoose.Schema(
  {
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
    approverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    comments: String,
  },
  { timestamps: true }
);

export default mongoose.model('Approval', ApprovalSchema);
