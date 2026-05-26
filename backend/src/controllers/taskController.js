const { Op } = require('sequelize');
const db = require('../models');
const { enqueue } = require('../services/queue');
const { serializeComment } = require('../utils/serializeComment');
const {
  cacheGet,
  cacheSet,
  invalidateTaskCaches,
  buildTaskListCacheKey,
} = require('../services/cache');
const { isRedisReady } = require('../config/redis');

const SORT_FIELDS = ['title', 'status', 'priority', 'due_date', 'created_at'];

async function list(req, res) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 10);
  const offset = (page - 1) * limit;
  const where = {};

  if (req.query.status) where.status = req.query.status;
  if (req.query.priority) where.priority = req.query.priority;
  if (req.query.assigned_user_id) where.assigned_user_id = req.query.assigned_user_id;
  if (req.query.search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${req.query.search}%` } },
      { description: { [Op.iLike]: `%${req.query.search}%` } },
    ];
  }

  const sortBy = SORT_FIELDS.includes(req.query.sortBy) ? req.query.sortBy : 'created_at';
  const order = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';

  const cacheKey = buildTaskListCacheKey({ ...req.query, page, limit, sortBy, order });
  const cached = await cacheGet(cacheKey);
  if (cached) {
    return res.json({ ...cached, meta: { ...cached.meta, cached: true } });
  }

  const { rows, count } = await db.Task.findAndCountAll({
    where,
    include: [
      { model: db.User, as: 'assignee', attributes: ['id', 'name', 'email'] },
      { model: db.User, as: 'creator', attributes: ['id', 'name', 'email'] },
    ],
    order: [[sortBy, order]],
    limit,
    offset,
  });

  const response = {
    data: rows,
    meta: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
  };
  await cacheSet(cacheKey, response);
  res.json({ ...response, meta: { ...response.meta, cached: false, redis: isRedisReady() } });
}

async function getOne(req, res) {
  const detailKey = `tasks:detail:${req.params.id}`;
  const cached = await cacheGet(detailKey);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  const task = await db.Task.findByPk(req.params.id, {
    include: [
      { model: db.User, as: 'assignee', attributes: ['id', 'name', 'email'] },
      { model: db.User, as: 'creator', attributes: ['id', 'name', 'email'] },
      { model: db.TaskAttachment, as: 'attachments' },
      {
        model: db.TaskComment,
        as: 'comments',
        include: [{ model: db.User, as: 'author', attributes: ['id', 'name', 'email'] }],
      },
    ],
  });
  if (!task) return res.status(404).json({ message: 'Task not found' });
  const json = task.toJSON();
  json.comments = (json.comments || []).map(serializeComment);
  await cacheSet(detailKey, json, 120);
  res.json({ ...json, cached: false });
}

async function create(req, res) {
  const task = await db.Task.create({
    ...req.body,
    created_by: req.user.id,
  });
  if (task.assigned_user_id) {
    enqueue('task_assigned_email', { taskId: task.id, userId: task.assigned_user_id });
  }
  const io = req.app.get('io');
  if (io) io.emit('task:created', task);
  await invalidateTaskCaches();
  res.status(201).json(task);
}

async function update(req, res) {
  const task = await db.Task.findByPk(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const prevAssignee = task.assigned_user_id;
  await task.update(req.body);

  if (task.assigned_user_id && task.assigned_user_id !== prevAssignee) {
    enqueue('task_assigned_email', { taskId: task.id, userId: task.assigned_user_id });
  }

  const io = req.app.get('io');
  if (io) io.emit('task:updated', task);
  await invalidateTaskCaches(task.id);
  res.json(task);
}

async function remove(req, res) {
  const task = await db.Task.findByPk(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  await task.destroy();
  const io = req.app.get('io');
  if (io) io.emit('task:deleted', { id: Number(req.params.id) });
  await invalidateTaskCaches(req.params.id);
  res.status(204).send();
}

async function bulkUpdateStatus(req, res) {
  const { taskIds, status } = req.body;
  await db.Task.update({ status }, { where: { id: taskIds } });
  await invalidateTaskCaches();
  enqueue('bulk_status_update', { taskIds, status });
  res.json({ message: 'Bulk update queued', count: taskIds.length });
}

async function exportTasks(req, res) {
  const tasks = await db.Task.findAll({ attributes: ['id', 'title', 'status', 'priority'] });
  enqueue('export_csv', { userId: req.user.id, tasks: tasks.map((t) => t.toJSON()) });
  res.json({ message: 'Export job queued' });
}

module.exports = { list, getOne, create, update, remove, bulkUpdateStatus, exportTasks };
