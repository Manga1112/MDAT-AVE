import mongoose from 'mongoose';

const ResumeSchema = new mongoose.Schema(
  {
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    fileId: { type: mongoose.Schema.Types.ObjectId, required: true }, // GridFS file id
    filename: String,
    contentType: String,
    size: Number,
    parsedText: String, // optional extracted text
  },
  { timestamps: true }
);

export default mongoose.model('Resume', ResumeSchema);
