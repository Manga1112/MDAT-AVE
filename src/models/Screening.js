import mongoose from 'mongoose';

const ScreeningSchema = new mongoose.Schema(
  {
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    score: Number,
    weights: { type: Object, default: { projects: 0.4, skills: 0.3, experience: 0.3 } },
    highlights: [String],
    gaps: [String],
    rationale: String,
    model: String,
    tokens: Number,
    status: { type: String, enum: ['queued', 'completed', 'failed'], default: 'queued' },
    error: String,
  },
  { timestamps: true }
);

export default mongoose.model('Screening', ScreeningSchema);
