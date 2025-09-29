import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';

dotenv.config();

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');
  await mongoose.connect(uri, { dbName: 'automation_hub' });
  console.log('Connected to MongoDB');

  const username = 'admin2';
  const password = 'ave22';
  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await User.findOne({ $or: [{ username }, { email: username }] });
  if (existing) {
    existing.username = username;
    existing.passwordHash = passwordHash;
    existing.role = 'Admin';
    existing.status = 'active';
    await existing.save();
    console.log('Admin user updated with username:', existing.username);
  } else {
    const user = await User.create({ username, email: undefined, passwordHash, role: 'Admin', status: 'active' });
    console.log('Admin user created with username:', user.username);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
