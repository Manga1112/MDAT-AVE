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

// Upload a file buffer to GridFS and return the fileId (ObjectId)
export async function uploadFileToGridFS(buffer, filename, contentType) {
  const bucket = getResumeBucket();
  return await new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, { contentType });
    uploadStream.on('error', reject);
    uploadStream.on('finish', () => {
      resolve(uploadStream.id);
    });
    uploadStream.end(buffer);
  });
}
