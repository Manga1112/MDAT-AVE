import mongoose from 'mongoose';

const ApplicationSchema = new mongoose.Schema(
  {
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    status: { type: String, enum: ['applied', 'screening', 'interview', 'offered', 'rejected', 'hired'], default: 'applied' },
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Application', ApplicationSchema);
