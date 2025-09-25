import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    name: { type: String, required: true },
    status: { type: String, default: 'In Progress' }, // In Progress | Blocked | Completed
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Project', ProjectSchema);
