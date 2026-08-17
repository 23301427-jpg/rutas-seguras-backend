const { Alert, Notification, EmergencyContact, User, Activity } = require('../models');
const { sendSMS } = require('./smsService');
const { getIO } = require('../sockets/socketInstance');

const ALERT_LABELS = {
  sos: 'SOS - boton de emergencia presionado',
  fall_detected: 'Posible caida detectada',
  inactivity: 'Inactividad prolongada detectada',
  low_battery: 'Bateria del telefono muy baja',
};

function buildMessage({ user, activity, alert }) {
  const mapsLink =
    alert.lat != null && alert.lng != null
      ? `https://maps.google.com/?q=${alert.lat},${alert.lng}`
      : 'Ubicacion no disponible';

  if (alert.type === 'sos') {
    return (
      `RUTAS SEGURAS - ALERTA SOS. ` +
      `${user.name} activo una emergencia. ` +
      `Ubicacion: ${mapsLink}`
    );
  }

  if (alert.type === 'fall_detected') {
    return (
      `RUTAS SEGURAS - POSIBLE CAIDA DETECTADA. ` +
      `${user.name} podria haber sufrido una caida. ` +
      `Ubicacion: ${mapsLink}`
    );
  }

  const label = ALERT_LABELS[alert.type] || 'Alerta de seguridad';

  return `RUTAS SEGURAS - ${label}. Usuario: ${user.name}.`;
}

async function createAlertAndNotify({ activity, user, type, lat, lng, message }) {
  const alert = await Alert.create({
    activityId: activity.id,
    userId: user.id,
    type,
    lat,
    lng,
    message: message || null,
  });

  const contacts = await EmergencyContact.findAll({
    where: { userId: user.id },
  });

  const notifications = [];
  const smsBody = buildMessage({
    user,
    activity,
    alert,
  });

  for (const contact of contacts) {
    const result = await sendSMS(contact.phone, smsBody);

    const notification = await Notification.create({
      alertId: alert.id,
      contactId: contact.id,
      channel: 'sms',
      destination: contact.phone,
      status: result.success ? 'sent' : 'failed',
      errorMessage: result.success ? null : result.error,
      sentAt: result.success ? new Date() : null,
    });

    notifications.push(notification);
  }

  const io = getIO();

  if (io) {
    io.to(`activity:${activity.id}`).emit('alert:new', {
      alert,
      activityId: activity.id,
    });
  }

  return {
    alert,
    notifications,
    contactsNotified: contacts.length,
  };
}

module.exports = {
  createAlertAndNotify,
  ALERT_LABELS,
};