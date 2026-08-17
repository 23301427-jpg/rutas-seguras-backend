const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

// Representa el smartphone del usuario (reemplaza al wearable original)
const Device = sequelize.define('Device', {
  id: {
    type: DataTypes.UUID,
    defaultValue: () => uuidv4(),
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  platform: {
    type: DataTypes.ENUM('android', 'ios', 'other'),
    defaultValue: 'other',
  },
  pushToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  batteryLevel: {
    type: DataTypes.INTEGER,
    allowNull: true, // 0-100
  },
  lastSeenAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'devices',
  timestamps: true,
});

module.exports = Device;
