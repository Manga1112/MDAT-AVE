import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, index: true },
    email: { type: String },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['Admin', 'HR', 'IT', 'Manager', 'Finance', 'Candidate', 'Employee'], required: true },
    department: { type: String, enum: ['IT', 'HR', 'Finance', 'Management', 'Candidate', 'Employee', null], default: null },
    status: { type: String, enum: ['active', 'disabled'], default: 'active' },
  },
  { timestamps: true }
);

export default mongoose.model('User', UserSchema);
