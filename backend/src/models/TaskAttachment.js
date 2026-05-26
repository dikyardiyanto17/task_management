module.exports = (sequelize, DataTypes) => {
  const TaskAttachment = sequelize.define(
    'TaskAttachment',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      task_id: { type: DataTypes.INTEGER, allowNull: false },
      file_name: { type: DataTypes.STRING(255), allowNull: false },
      file_path: { type: DataTypes.TEXT, allowNull: false },
      file_size: { type: DataTypes.INTEGER, allowNull: false },
      mime_type: { type: DataTypes.STRING(120), allowNull: false },
      thumbnail_path: { type: DataTypes.TEXT },
      uploaded_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
      tableName: 'task_attachments',
      underscored: true,
      timestamps: false,
    }
  );

  TaskAttachment.associate = (db) => {
    TaskAttachment.belongsTo(db.Task, { foreignKey: 'task_id', as: 'task' });
  };

  return TaskAttachment;
};
