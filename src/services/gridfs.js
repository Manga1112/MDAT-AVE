import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

export function getResumeBucket() {
  const db = mongoose.connection.db;
  return new GridFSBucket(db, { bucketName: 'resumes' });
}

export function openDownloadStream(fileId) {
  const bucket = getResumeBucket();
  return bucket.openDownloadStream(fileId);
}
