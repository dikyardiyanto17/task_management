const express = require('express');
const { query } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

router.get(
  '/',
  [query('search').optional().trim(), query('limit').optional().isInt({ min: 1, max: 50 })],
  validate,
  userController.list
);

module.exports = router;
