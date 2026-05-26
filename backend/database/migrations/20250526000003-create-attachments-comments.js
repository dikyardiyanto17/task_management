'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('task_attachments', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      task_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tasks', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      file_name: { type: Sequelize.STRING(255), allowNull: false },
      file_path: { type: Sequelize.TEXT, allowNull: false },
      file_size: { type: Sequelize.INTEGER, allowNull: false },
      mime_type: { type: Sequelize.STRING(120), allowNull: false },
      thumbnail_path: { type: Sequelize.TEXT },
      uploaded_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('task_attachments', ['task_id']);
    await queryInterface.addIndex('task_attachments', ['mime_type']);

    await queryInterface.createTable('task_comments', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      task_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tasks', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      comment: { type: Sequelize.TEXT, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('task_comments', ['task_id']);
    await queryInterface.addIndex('task_comments', ['user_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('task_comments');
    await queryInterface.dropTable('task_attachments');
  },
};
