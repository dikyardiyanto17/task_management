const express = require('express');
const { param } = require('express-validator');
const attachmentController = require('../controllers/attachmentController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/:id/stream', [param('id').isInt()], validate, attachmentController.streamVideo);
router.use(authenticate);
router.get('/:id/download', [param('id').isInt()], validate, attachmentController.download);
router.delete('/:id', [param('id').isInt()], validate, attachmentController.remove);

module.exports = router;
