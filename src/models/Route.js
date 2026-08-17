const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');

const Route = sequelize.define('Route', {
  id: {
    type: DataTypes.UUID,
    defaultValue: () => uuidv4(),
    primaryKey: true,
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true, // rutas del catálogo público pueden no tener dueño
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM('hiking', 'cycling'),
    allowNull: false,
    defaultValue: 'hiking',
  },
  difficulty: {
    type: DataTypes.ENUM('facil', 'moderada', 'dificil'),
    allowNull: false,
    defaultValue: 'moderada',
  },
  distanceKm: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  elevationGain: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0,
  },
  // Coordenadas del trazado de la ruta guardadas como JSON: [{lat, lng}, ...]
  coordinates: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: '[]',
    get() {
      const raw = this.getDataValue('coordinates');
      try { return JSON.parse(raw || '[]'); } catch { return []; }
    },
    set(value) {
      this.setDataValue('coordinates', JSON.stringify(value || []));
    },
  },
  avgRating: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  ratingsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'routes',
  timestamps: true,
});

module.exports = Route;
