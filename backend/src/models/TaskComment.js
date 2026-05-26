module.exports = (sequelize, DataTypes) => {
  const TaskComment = sequelize.define(
    'TaskComment',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      task_id: { type: DataTypes.INTEGER, allowNull: false },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      comment: { type: DataTypes.TEXT, allowNull: false },
    },
    {
      tableName: 'task_comments',
      underscored: true,
      updatedAt: false,
    }
  );

  TaskComment.associate = (db) => {
    TaskComment.belongsTo(db.Task, { foreignKey: 'task_id', as: 'task' });
    TaskComment.belongsTo(db.User, { foreignKey: 'user_id', as: 'author' });
  };

  return TaskComment;
};
