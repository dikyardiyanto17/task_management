const fs = require('fs');
const path = require('path');

const jobs = [];
let processing = false;
let io = null;

function setSocketServer(socketIo) {
  io = socketIo;
}

function enqueue(type, payload) {
  const job = { id: Date.now() + Math.random(), type, payload, status: 'pending' };
  jobs.push(job);
  processQueue();
  return job.id;
}

async function processQueue() {
  if (processing || jobs.length === 0) return;
  processing = true;
  while (jobs.length > 0) {
    const job = jobs.shift();
    job.status = 'processing';
    try {
      await runJob(job);
      job.status = 'completed';
    } catch (err) {
      job.status = 'failed';
      job.error = err.message;
    }
  }
  processing = false;
}

async function runJob(job) {
  switch (job.type) {
    case 'task_assigned_email':
      console.log(`[Queue] Email: task ${job.payload.taskId} assigned to user ${job.payload.userId}`);
      break;
    case 'bulk_status_update':
      console.log(`[Queue] Bulk update ${job.payload.taskIds.length} tasks to ${job.payload.status}`);
      if (io) io.emit('tasks:bulk_updated', job.payload);
      break;
    case 'file_process':
      console.log(`[Queue] Process file attachment ${job.payload.attachmentId}`);
      break;
    case 'export_csv':
      await exportTasksCsv(job.payload);
      break;
    case 'virus_scan':
      console.log(`[Queue] Virus scan simulation passed for ${job.payload.fileName}`);
      break;
    default:
      console.log(`[Queue] Unknown job type: ${job.type}`);
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

module.exports = { enqueue, setSocketServer };
