const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

// Una Activity es una salida/viaje: el "modo actividad" que el usuario activa
// antes de salir a caminar/andar en bici.
const Activity = sequelize.define('Activity', {
  id: {
    type: DataTypes.UUID,
    defaultValue: () => uuidv4(),
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  routeId: {
    type: DataTypes.UUID,
    allowNull: true, // se puede iniciar una actividad libre, sin ruta predefinida
  },
  mode: {
    type: DataTypes.ENUM('hiking', 'cycling'),
    allowNull: false,
    defaultValue: 'hiking',
  },
  status: {
    type: DataTypes.ENUM('planned', 'active', 'paused', 'completed', 'cancelled'),
    defaultValue: 'planned',
  },
  // Token público para que el contacto de emergencia pueda ver el seguimiento
  // en vivo sin necesidad de tener cuenta (link compartible).
  shareToken: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    defaultValue: () => uuidv4(),
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  endedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lastLat: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  lastLng: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  lastLocationAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  distanceCoveredKm: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  userRatingOfRoute: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'activities',
  timestamps: true,
});

module.exports = Activity;
