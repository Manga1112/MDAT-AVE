import mongoose from 'mongoose';
import logger from './logger.js';
import { env } from './env.js';

export async function connectDB() {
  if (!env.mongoUri) {
    throw new Error('MONGODB_URI is not set');
  }
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(env.mongoUri, { dbName: 'automation_hub' });
    logger.info('MongoDB connected');
  } catch (err) {
    logger.error({ err }, 'MongoDB connection error');
    throw err;
  }
}
