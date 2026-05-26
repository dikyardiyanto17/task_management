module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define(
    'Task',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      title: { type: DataTypes.STRING(255), allowNull: false },
      description: { type: DataTypes.TEXT },
      status: {
        type: DataTypes.ENUM('todo', 'in_progress', 'review', 'done'),
        defaultValue: 'todo',
      },
      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium',
      },
      assigned_user_id: { type: DataTypes.INTEGER },
      created_by: { type: DataTypes.INTEGER, allowNull: false },
      due_date: { type: DataTypes.DATEONLY },
    },
    { tableName: 'tasks', underscored: true }
  );

  Task.associate = (db) => {
    Task.belongsTo(db.User, { foreignKey: 'assigned_user_id', as: 'assignee' });
    Task.belongsTo(db.User, { foreignKey: 'created_by', as: 'creator' });
    Task.hasMany(db.TaskAttachment, { foreignKey: 'task_id', as: 'attachments' });
    Task.hasMany(db.TaskComment, { foreignKey: 'task_id', as: 'comments' });
  };

  return Task;
};
