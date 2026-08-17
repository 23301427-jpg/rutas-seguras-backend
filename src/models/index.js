const sequelize = require('../config/database');

const User = require('./User');
const EmergencyContact = require('./EmergencyContact');
const Device = require('./Device');
const Route = require('./Route');
const Review = require('./Review');
const Activity = require('./Activity');
const LocationPing = require('./LocationPing');
const Alert = require('./Alert');
const Notification = require('./Notification');

// ---- Asociaciones ----

// Usuario -> Contactos de emergencia
User.hasMany(EmergencyContact, { foreignKey: 'userId', as: 'contacts', onDelete: 'CASCADE' });
EmergencyContact.belongsTo(User, { foreignKey: 'userId' });

// Usuario -> Dispositivos
User.hasMany(Device, { foreignKey: 'userId', as: 'devices', onDelete: 'CASCADE' });
Device.belongsTo(User, { foreignKey: 'userId' });

// Usuario -> Rutas creadas
User.hasMany(Route, { foreignKey: 'createdBy', as: 'createdRoutes' });
Route.belongsTo(User, { foreignKey: 'createdBy', as: 'author' });

// Ruta -> Reseñas
Route.hasMany(Review, { foreignKey: 'routeId', as: 'reviews', onDelete: 'CASCADE' });
Review.belongsTo(Route, { foreignKey: 'routeId' });
User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'author' });

// Usuario -> Actividades (bitácora)
User.hasMany(Activity, { foreignKey: 'userId', as: 'activities' });
Activity.belongsTo(User, { foreignKey: 'userId' });

// Ruta -> Actividades
Route.hasMany(Activity, { foreignKey: 'routeId', as: 'activities' });
Activity.belongsTo(Route, { foreignKey: 'routeId', as: 'route' });

// Actividad -> Puntos de ubicación (tracking)
Activity.hasMany(LocationPing, { foreignKey: 'activityId', as: 'pings', onDelete: 'CASCADE' });
LocationPing.belongsTo(Activity, { foreignKey: 'activityId' });

// Actividad -> Alertas
Activity.hasMany(Alert, { foreignKey: 'activityId', as: 'alerts', onDelete: 'CASCADE' });
Alert.belongsTo(Activity, { foreignKey: 'activityId' });
User.hasMany(Alert, { foreignKey: 'userId', as: 'alerts' });
Alert.belongsTo(User, { foreignKey: 'userId' });

// Alerta -> Notificaciones
Alert.hasMany(Notification, { foreignKey: 'alertId', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(Alert, { foreignKey: 'alertId' });
EmergencyContact.hasMany(Notification, { foreignKey: 'contactId', as: 'notifications' });
Notification.belongsTo(EmergencyContact, { foreignKey: 'contactId', as: 'contact' });

module.exports = {
  sequelize,
  User,
  EmergencyContact,
  Device,
  Route,
  Review,
  Activity,
  LocationPing,
  Alert,
  Notification,
};
