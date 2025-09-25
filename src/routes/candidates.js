import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/auth.js';
import Candidate from '../models/Candidate.js';
import Resume from '../models/Resume.js';
import { uploadResume } from '../services/storage.js';
import { openDownloadStream } from '../services/gridfs.js';

const router = Router();

// Create or get candidate profile for logged-in candidate
router.post('/me', requireAuth, async (req, res) => {
  try {
    const { name, phone } = req.body;
    let cand = await Candidate.findOne({ userId: req.user.id });
    if (!cand) {
      cand = await Candidate.create({ userId: req.user.id, name: name || 'Candidate', email: 'unknown', phone });
    } else {
      if (name) cand.name = name;
      if (phone) cand.phone = phone;
      await cand.save();
    }
    res.json(cand);
  } catch (e) {
    res.status(500).json({ message: 'Failed to upsert candidate' });
  }
});

// Upload resume (<=30KB enforced)
router.post('/:candidateId/resume', requireAuth, uploadResume.single('resume'), async (req, res) => {
  try {
    const { candidateId } = req.params;
    if (!mongoose.isValidObjectId(candidateId)) return res.status(400).json({ message: 'Invalid candidateId' });
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No file uploaded' });

    const resume = await Resume.create({
      candidateId,
      fileId: file.id,
      filename: file.filename,
      contentType: file.mimetype,
      size: file.size,
    });

    res.status(201).json({ id: resume._id, fileId: resume.fileId, size: resume.size });
  } catch (e) {
    const msg = e?.message?.includes('File too large') ? 'File too large (max 30KB)' : 'Upload failed';
    res.status(400).json({ message: msg });
  }
});

export default router;

// Download latest resume or by resumeId
router.get('/:candidateId/resume/download', requireAuth, async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { resumeId } = req.query;
    if (!mongoose.isValidObjectId(candidateId)) return res.status(400).json({ message: 'Invalid candidateId' });
    let resume;
    if (resumeId) {
      if (!mongoose.isValidObjectId(resumeId)) return res.status(400).json({ message: 'Invalid resumeId' });
      resume = await Resume.findOne({ _id: resumeId, candidateId });
    } else {
      resume = await Resume.findOne({ candidateId }).sort({ createdAt: -1 });
    }
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    res.setHeader('Content-Type', resume.contentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${resume.filename || 'resume'}"`);
    const stream = openDownloadStream(resume.fileId);
    stream.on('error', () => res.status(500).end());
    stream.pipe(res);
  } catch (e) {
    res.status(500).json({ message: 'Download failed' });
  }
});
