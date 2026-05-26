const fs = require('fs');
const path = require('path');
const Queue = require('bull');
const { isRedisConfigured, isRedisReady } = require('../config/redis');

const memoryJobs = [];
let memoryProcessing = false;
let io = null;
let bullQueue = null;

function setSocketServer(socketIo) {
  io = socketIo;
}

async function runJob(job) {
  const type = job.type || job.name;
  const payload = job.payload || job.data;

  switch (type) {
    case 'task_assigned_email':
      console.log(`[Queue] Email: task ${payload.taskId} assigned to user ${payload.userId}`);
      break;
    case 'bulk_status_update':
      console.log(`[Queue] Bulk update ${payload.taskIds.length} tasks to ${payload.status}`);
      if (io) io.emit('tasks:bulk_updated', payload);
      break;
    case 'file_process':
      console.log(`[Queue] Process file attachment ${payload.attachmentId}`);
      break;
    case 'export_csv':
      await exportTasksCsv(payload);
      break;
    case 'virus_scan':
      console.log(`[Queue] Virus scan simulation passed for ${payload.fileName}`);
      break;
    default:
      console.log(`[Queue] Unknown job type: ${type}`);
  }
}

async function exportTasksCsv({ userId, tasks }) {
  const dir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `tasks-${userId}-${Date.now()}.csv`);
  const header = 'id,title,status,priority\n';
  const rows = tasks.map((t) => `${t.id},"${t.title}",${t.status},${t.priority}`).join('\n');
  await fs.promises.writeFile(file, header + rows);
  console.log(`[Queue] Export written: ${file}`);
  if (io) io.to(`user:${userId}`).emit('export:ready', { file: path.basename(file) });
}

async function processMemoryQueue() {
  if (memoryProcessing || memoryJobs.length === 0) return;
  memoryProcessing = true;
  while (memoryJobs.length > 0) {
    const job = memoryJobs.shift();
    try {
      await runJob(job);
    } catch (err) {
      console.error('[Queue] job failed:', err.message);
    }
  }
  memoryProcessing = false;
}

function enqueue(type, payload) {
  if (bullQueue && isRedisReady()) {
    return bullQueue.add(type, payload);
  }
  const job = { type, payload };
  memoryJobs.push(job);
  processMemoryQueue();
  return Promise.resolve(job);
}

async function initQueue() {
  if (!isRedisConfigured() || !isRedisReady()) {
    console.log('[Queue] Bull disabled — in-memory fallback');
    return;
  }

  bullQueue = new Queue('task-jobs', process.env.REDIS_URL);
  bullQueue.on('error', (err) => console.error('[Queue] Bull error:', err.message));
  bullQueue.process(async (job) => runJob(job));

  console.log('[Queue] Bull worker listening on Redis');
}

async function closeQueue() {
  if (bullQueue) {
    await bullQueue.close();
    bullQueue = null;
  }
}

module.exports = { enqueue, setSocketServer, initQueue, closeQueue };
