const express = require('express');
const { body, param } = require('express-validator');
const taskController = require('../controllers/taskController');
const commentController = require('../controllers/commentController');
const attachmentController = require('../controllers/attachmentController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');

const router = express.Router();
router.use(authenticate);

router.get('/', taskController.list);
router.post('/bulk-status', taskController.bulkUpdateStatus);
router.post('/export', taskController.exportTasks);
router.post(
  '/',
  [
    body('title').trim().notEmpty(),
    body('status').optional().isIn(['todo', 'in_progress', 'review', 'done']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  ],
  validate,
  taskController.create
);
router.get('/:id', [param('id').isInt()], validate, taskController.getOne);
router.put(
  '/:id',
  [param('id').isInt(), body('title').optional().trim().notEmpty()],
  validate,
  taskController.update
);
router.delete('/:id', [param('id').isInt()], validate, taskController.remove);
router.get('/:taskId/comments', [param('taskId').isInt()], validate, commentController.listByTask);
router.post(
  '/:taskId/comments',
  [param('taskId').isInt(), body('comment').trim().notEmpty()],
  validate,
  commentController.create
);
router.post(
  '/:id/attachments',
  [param('id').isInt()],
  validate,
  upload.single('file'),
  attachmentController.upload
);

module.exports = router;
