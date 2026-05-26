const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(120), allowNull: false },
      email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      password: { type: DataTypes.STRING(255), allowNull: false },
      role: {
        type: DataTypes.ENUM('admin', 'manager', 'member'),
        defaultValue: 'member',
      },
    },
    { tableName: 'users', underscored: true }
  );

  User.beforeCreate(async (user) => {
    user.password = await bcrypt.hash(user.password, 10);
  });
  User.beforeUpdate(async (user) => {
    if (user.changed('password')) {
      user.password = await bcrypt.hash(user.password, 10);
    }
  });

  User.prototype.validatePassword = function (plain) {
    return bcrypt.compare(plain, this.password);
  };

  User.associate = (db) => {
    User.hasMany(db.Task, { foreignKey: 'assigned_user_id', as: 'assignedTasks' });
    User.hasMany(db.Task, { foreignKey: 'created_by', as: 'createdTasks' });
    User.hasMany(db.TaskComment, { foreignKey: 'user_id', as: 'comments' });
  };

  return User;
};
