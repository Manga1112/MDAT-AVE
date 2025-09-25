import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (d) => chunks.push(d));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

export async function parseResumeStream(stream, contentType) {
  const buf = await streamToBuffer(stream);
  if (!contentType) return buf.toString('utf-8');
  if (contentType.includes('pdf')) {
    const res = await pdfParse(buf);
    return res.text || '';
  }
  if (contentType.includes('wordprocessingml') || contentType.includes('msword') || contentType.includes('officedocument')) {
    const { value } = await mammoth.convertToText({ buffer: buf });
    return value || '';
  }
  if (contentType.includes('text')) {
    return buf.toString('utf-8');
  }
  // Fallback to utf-8
  return buf.toString('utf-8');
}
