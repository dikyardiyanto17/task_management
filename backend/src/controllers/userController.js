const { Op } = require('sequelize');
const db = require('../models');

async function list(req, res) {
  const search = (req.query.search || '').trim();
  const limit = Math.min(20, parseInt(req.query.limit, 10) || 10);
  const where = {};

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const users = await db.User.findAll({
    where,
    attributes: ['id', 'name', 'email', 'role'],
    order: [['name', 'ASC']],
    limit,
  });

  res.json(users);
}

module.exports = { list };
