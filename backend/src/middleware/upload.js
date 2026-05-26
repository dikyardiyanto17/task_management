const multer = require('multer');
const path = require('path');

const MAX_MB = Number(process.env.MAX_FILE_SIZE_MB) || 100;
const MAX_BYTES = MAX_MB * 1024 * 1024;

function isAllowedMime(mimetype) {
  if (!mimetype) return false;
  if (mimetype.startsWith('image/') || mimetype.startsWith('video/')) return true;
  const docs = new Set([
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-zip-compressed',
  ]);
  return docs.has(mimetype);
}

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!isAllowedMime(file.mimetype)) {
      return cb(new Error('Only images, videos, and documents are allowed'));
    }
    const ext = path.extname(file.originalname).toLowerCase();
    const blocked = ['.exe', '.bat', '.sh', '.php', '.js'];
    if (blocked.includes(ext)) {
      return cb(new Error('Dangerous file extension'));
    }
    cb(null, true);
  },
});

module.exports = upload;
