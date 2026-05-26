'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const hash = await bcrypt.hash('password123', 10);

    const users = [
      { name: 'Alice Admin', email: 'alice@example.com', password: hash, role: 'admin' },
      { name: 'Bob Manager', email: 'bob@example.com', password: hash, role: 'manager' },
      { name: 'Carol Member', email: 'carol@example.com', password: hash, role: 'member' },
      { name: 'Dave Developer', email: 'dave@example.com', password: hash, role: 'member' },
      { name: 'Eve Engineer', email: 'eve@example.com', password: hash, role: 'member' },
    ].map((u) => ({ ...u, created_at: now, updated_at: now }));

    await queryInterface.bulkInsert('users', users);
    const statuses = ['todo', 'in_progress', 'review', 'done'];
    const priorities = ['low', 'medium', 'high', 'urgent'];
    const tasks = [];

    for (let i = 1; i <= 15; i++) {
      tasks.push({
        title: `Task ${i}`,
        description: `Description for task ${i}`,
        status: statuses[i % statuses.length],
        priority: priorities[i % priorities.length],
        assigned_user_id: (i % 5) + 1,
        created_by: ((i + 1) % 5) + 1,
        due_date: `2026-0${(i % 9) + 1}-15`,
        created_at: now,
        updated_at: now,
      });
    }
    await queryInterface.bulkInsert('tasks', tasks);

    const comments = [];
    for (let i = 1; i <= 10; i++) {
      comments.push({
        task_id: (i % 15) + 1,
        user_id: (i % 5) + 1,
        comment: `Sample comment #${i} on this task.`,
        created_at: now,
      });
    }
    await queryInterface.bulkInsert('task_comments', comments);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('task_comments', null, {});
    await queryInterface.bulkDelete('task_attachments', null, {});
    await queryInterface.bulkDelete('tasks', null, {});
    await queryInterface.bulkDelete('users', null, {});
  },
};
