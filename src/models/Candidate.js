import mongoose from 'mongoose';

const StageSchema = new mongoose.Schema(
  {
    name: { type: String, enum: ['Applied', 'Screened', 'Interviewed', 'Shortlisted', 'Offer', 'Hired', 'Rejected'], required: true },
    note: String,
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CandidateSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    email: { type: String, required: true, index: true },
    phone: String,
    stages: { type: [StageSchema], default: [{ name: 'Applied', at: new Date() }] },
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model('Candidate', CandidateSchema);
