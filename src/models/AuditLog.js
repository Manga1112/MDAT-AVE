import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: String,
    targetType: String,
    targetId: String,
    before: Object,
    after: Object,
    ip: String,
  },
  { timestamps: { createdAt: 'timestamp', updatedAt: false } }
);

export default mongoose.model('AuditLog', AuditLogSchema);
