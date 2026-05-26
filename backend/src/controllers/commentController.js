const db = require('../models');
const { serializeComment } = require('../utils/serializeComment');

async function listByTask(req, res) {  const comments = await db.TaskComment.findAll({
    where: { task_id: req.params.taskId },
    include: [{ model: db.User, as: 'author', attributes: ['id', 'name', 'email'] }],
    order: [['created_at', 'ASC']],
  });
  res.json(comments.map(serializeComment));
}

async function create(req, res) {
  const task = await db.Task.findByPk(req.params.taskId);
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const comment = await db.TaskComment.create({
    task_id: task.id,
    user_id: req.user.id,
    comment: req.body.comment,
  });

  const full = await db.TaskComment.findByPk(comment.id, {
    include: [{ model: db.User, as: 'author', attributes: ['id', 'name', 'email'] }],
  });

  const payload = serializeComment(full);

  const io = req.app.get('io');
  if (io) {
    io.to(`task:${task.id}`).emit('comment:added', payload);
    io.to(`task:${task.id}`).emit('comment:typing', { userId: req.user.id, typing: false });
  }

  res.status(201).json(payload);
}

module.exports = { listByTask, create };
