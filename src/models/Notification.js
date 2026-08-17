const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

// Registro de cada notificación enviada (por ahora canal principal: SMS)
const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: () => uuidv4(),
    primaryKey: true,
  },
  alertId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  contactId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  channel: {
    type: DataTypes.ENUM('sms', 'push', 'email'),
    defaultValue: 'sms',
  },
  destination: {
    type: DataTypes.STRING,
    allowNull: true, // número de teléfono / correo destino
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'failed'),
    defaultValue: 'pending',
  },
  errorMessage: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'notifications',
  timestamps: true,
});

module.exports = Notification;
