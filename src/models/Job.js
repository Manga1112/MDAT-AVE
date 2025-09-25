import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    department: { type: String, enum: ['IT', 'HR', 'Finance', 'Management'], required: true },
    jdText: { type: String, required: true },
    requirements: { type: [String], default: [] },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
  },
  { timestamps: true }
);

export default mongoose.model('Job', JobSchema);
