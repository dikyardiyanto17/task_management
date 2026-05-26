const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const { encryptPath, decryptPath } = require('./pathEncryption');

const UPLOAD_ROOT = path.resolve(
  process.cwd(),
  process.env.UPLOAD_DIR || 'uploads'
);

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getAbsolutePath(relativePath) {
  const full = path.join(UPLOAD_ROOT, relativePath);
  const resolved = path.resolve(full);
  if (!resolved.startsWith(UPLOAD_ROOT)) {
    throw new Error('Invalid file path');
  }
  return resolved;
}

async function saveFile(taskId, file) {
  const subDir = path.join(String(taskId), uuidv4());
  const dir = path.join(UPLOAD_ROOT, subDir);
  ensureDir(dir);
  const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const relativePath = path.join(subDir, safeName);
  const absolutePath = getAbsolutePath(relativePath);
  await fs.promises.writeFile(absolutePath, file.buffer);
  return { relativePath, absolutePath, safeName };
}

async function generateThumbnail(absolutePath, mimeType) {
  if (!mimeType.startsWith('image/')) return null;
  const thumbRel = `${path.relative(UPLOAD_ROOT, absolutePath)}.thumb.jpg`;
  const thumbAbs = path.join(UPLOAD_ROOT, thumbRel);
  ensureDir(path.dirname(thumbAbs));
  await sharp(absolutePath).resize(320, 320, { fit: 'inside' }).jpeg().toFile(thumbAbs);
  return encryptPath(thumbRel);
}

function resolveStoredPath(encryptedPath) {
  const relative = decryptPath(encryptedPath);
  return getAbsolutePath(relative);
}

async function deleteStoredFile(encryptedPath) {
  const abs = resolveStoredPath(encryptedPath);
  if (fs.existsSync(abs)) await fs.promises.unlink(abs);
}

module.exports = {
  UPLOAD_ROOT,
  ensureDir,
  saveFile,
  encryptPath,
  decryptPath,
  generateThumbnail,
  resolveStoredPath,
  deleteStoredFile,
  getAbsolutePath,
};
