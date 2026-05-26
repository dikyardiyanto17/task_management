const fs = require('fs');
const jwt = require('jsonwebtoken');
const db = require('../models');
const {
  saveFile,
  encryptPath,
  generateThumbnail,
  resolveStoredPath,
  deleteStoredFile,
} = require('../services/fileStorage');
const { enqueue } = require('../services/queue');
const { invalidateTaskCaches } = require('../services/cache');

async function upload(req, res) {
  const task = await db.Task.findByPk(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  enqueue('virus_scan', { fileName: req.file.originalname });

  const { relativePath, safeName } = await saveFile(task.id, req.file);
  const encryptedPath = encryptPath(relativePath);
  let thumbnailPath = null;

  if (req.file.mimetype.startsWith('image/')) {
    const abs = resolveStoredPath(encryptedPath);
    thumbnailPath = await generateThumbnail(abs, req.file.mimetype);
    enqueue('file_process', { attachmentId: 'pending', type: 'thumbnail' });
  }

  const attachment = await db.TaskAttachment.create({
    task_id: task.id,
    file_name: safeName,
    file_path: encryptedPath,
    file_size: req.file.size,
    mime_type: req.file.mimetype,
    thumbnail_path: thumbnailPath,
  });

  await invalidateTaskCaches(task.id);

  const payload = attachment.toJSON();
  const io = req.app.get('io');
  if (io) io.to(`task:${task.id}`).emit('attachment:added', payload);

  res.status(201).json(payload);
}

async function download(req, res) {
  const attachment = await db.TaskAttachment.findByPk(req.params.id);
  if (!attachment) return res.status(404).json({ message: 'Attachment not found' });

  const absPath = resolveStoredPath(attachment.file_path);
  if (!fs.existsSync(absPath)) {
    return res.status(404).json({ message: 'File not found on disk' });
  }

  res.download(absPath, attachment.file_name);
}

function verifyStreamAuth(req) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : req.query.token;
  if (!token) return false;
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

async function streamVideo(req, res) {
  if (!verifyStreamAuth(req)) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  const attachment = await db.TaskAttachment.findByPk(req.params.id);
  if (!attachment) return res.status(404).json({ message: 'Attachment not found' });
  if (!attachment.mime_type.startsWith('video/')) {
    return res.status(400).json({ message: 'Not a video attachment' });
  }

  const absPath = resolveStoredPath(attachment.file_path);
  if (!fs.existsSync(absPath)) {
    return res.status(404).json({ message: 'Video file not found' });
  }

  const stat = fs.statSync(absPath);
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
      'Content-Type': attachment.mime_type,
    });
    fs.createReadStream(absPath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': stat.size,
      'Content-Type': attachment.mime_type,
    });
    fs.createReadStream(absPath).pipe(res);
  }
}

async function remove(req, res) {
  const attachment = await db.TaskAttachment.findByPk(req.params.id);
  if (!attachment) return res.status(404).json({ message: 'Attachment not found' });

  await deleteStoredFile(attachment.file_path);
  if (attachment.thumbnail_path) {
    try {
      await deleteStoredFile(attachment.thumbnail_path);
    } catch {
      /* thumbnail optional */
    }
  }
  const taskId = attachment.task_id;
  await attachment.destroy();
  await invalidateTaskCaches(taskId);
  res.status(204).send();
}

module.exports = { upload, download, streamVideo, remove };
