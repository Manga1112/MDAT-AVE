import { GridFsStorage } from 'multer-gridfs-storage';
import multer from 'multer';
import { env } from '../config/env.js';
import mime from 'mime-types';

function withDbName(uri) {
  try {
    const u = new URL(uri);
    // If no db name present (pathname is '/' or empty), default to automation_hub
    if (!u.pathname || u.pathname === '/' ) {
      u.pathname = '/automation_hub';
    }
    return u.toString();
  } catch {
    // Fallback to original if parsing fails
    return uri;
  }
}

const storage = new GridFsStorage({
  url: withDbName(env.mongoUri),
  file: (req, file) => {
    const ext = mime.extension(file.mimetype) || 'bin';
    return {
      bucketName: 'resumes',
      filename: `${Date.now()}-${file.originalname}`,
      metadata: { uploadedBy: req.user?.id || 'anonymous' },
      contentType: file.mimetype,
    };
  },
});

export const uploadResume = multer({
  storage,
  limits: { fileSize: env.maxResumeSizeBytes },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Invalid file type'));
    }
    cb(null, true);
  },
});
