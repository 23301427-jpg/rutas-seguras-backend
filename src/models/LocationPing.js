const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

// Cada punto GPS enviado por la app mientras la actividad está activa.
// El campo accelMagnitude permite que el backend guarde referencia de
// la lectura del acelerómetro (la detección fina de caída ocurre en el
// teléfono, pero el backend guarda el dato para trazabilidad/depuración).
const LocationPing = sequelize.define('LocationPing', {
  id: {
    type: DataTypes.UUID,
    defaultValue: () => uuidv4(),
    primaryKey: true,
  },
  activityId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  lat: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  lng: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  altitude: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  speed: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  accelMagnitude: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  batteryLevel: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  recordedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'location_pings',
  timestamps: true,
});

module.exports = LocationPing;
