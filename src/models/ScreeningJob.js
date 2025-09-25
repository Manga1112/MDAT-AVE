import mongoose from 'mongoose';

const TokenUsageSchema = new mongoose.Schema(
  {
    total_tokens: Number,
    prompt_tokens: Number,
    completion_tokens: Number,
  },
  { _id: false }
);

const ScreeningJobSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    status: { type: String, enum: ['queued', 'processing', 'completed', 'failed'], default: 'queued' },
    total: { type: Number, default: 0 },
    processed: { type: Number, default: 0 },
    provider: { type: String, default: 'grok' },
    token_usage: { type: TokenUsageSchema, default: null },
    error: String,
  },
  { timestamps: true }
);

export default mongoose.model('ScreeningJob', ScreeningJobSchema);
