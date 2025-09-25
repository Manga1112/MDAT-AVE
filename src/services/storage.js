import { GridFsStorage } from 'multer-gridfs-storage';
import multer from 'multer';
import { env } from '../config/env.js';
import mime from 'mime-types';

const storage = new GridFsStorage({
  url: env.mongoUri,
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
