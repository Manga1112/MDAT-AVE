import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');
  await mongoose.connect(uri, { dbName: 'automation_hub' });
  const db = mongoose.connection.db;

  const coll = db.collection('users');
  const indexes = await coll.indexes();
  console.log('Existing indexes:', indexes);

  // Drop unique index on email if exists (commonly named 'email_1')
  const emailIdx = indexes.find((i) => i.name === 'email_1');
  if (emailIdx) {
    console.log('Dropping index email_1');
    await coll.dropIndex('email_1');
  }

  // Ensure username unique index exists
  const usernameIdx = indexes.find((i) => i.name === 'username_1');
  if (!usernameIdx || !usernameIdx.unique) {
    if (usernameIdx) {
      console.log('Dropping non-unique username_1 to recreate as unique');
      await coll.dropIndex('username_1');
    }
    console.log('Creating unique index on username');
    await coll.createIndex({ username: 1 }, { unique: true });
  }

  // Optional: non-unique index on role for faster admin queries
  if (!indexes.find((i) => i.name === 'role_1')) {
    await coll.createIndex({ role: 1 }, { background: true });
  }

  console.log('Indexes fixed.');
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
