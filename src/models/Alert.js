const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

// Une "Alertas" e "Incidentes" en una sola entidad simple: type distingue
// el origen (sos manual, caída detectada, inactividad, batería baja).
const Alert = sequelize.define('Alert', {
  id: {
    type: DataTypes.UUID,
    defaultValue: () => uuidv4(),
    primaryKey: true,
  },
  activityId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('sos', 'fall_detected', 'inactivity', 'low_battery'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('open', 'resolved', 'false_alarm'),
    defaultValue: 'open',
  },
  lat: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  lng: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  message: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'alerts',
  timestamps: true,
});

module.exports = Alert;
