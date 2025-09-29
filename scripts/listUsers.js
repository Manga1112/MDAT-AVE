import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

dotenv.config();

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');
  await mongoose.connect(uri, { dbName: 'automation_hub' });
  const users = await User.find({}, { username: 1, role: 1, department: 1, status: 1, createdAt: 1 }).sort({ createdAt: -1 }).lean();
  console.log('Users:', users.map(u => ({ id: String(u._id), username: u.username, role: u.role, dept: u.department, status: u.status })));
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
