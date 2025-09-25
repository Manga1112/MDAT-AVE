import mongoose from 'mongoose';

const OfferSchema = new mongoose.Schema(
  {
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    status: { type: String, enum: ['draft', 'pending_finance', 'approved', 'rejected', 'sent', 'accepted', 'declined'], default: 'draft' },
    salary: { type: Number },
    currency: { type: String, default: 'USD' },
    startDate: { type: Date },
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Offer', OfferSchema);
