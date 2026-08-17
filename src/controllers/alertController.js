const { Alert, Activity, Notification, User } = require('../models');
const { createAlertAndNotify } = require('../services/alertService');
const { getIO } = require('../sockets/socketInstance');

/**
 * Crea una alerta manualmente. Cubre principalmente el botón SOS de la app,
 * pero también permite reportar "fall_detected" desde el cliente cuando el
 * propio teléfono ya resolvió la detección de caída con su acelerómetro.
 * Dispara el envío de SMS al/los contacto(s) de emergencia vinculados a la cuenta.
 */
async function createAlert(req, res, next) {
  try {
    const { activityId, type, lat, lng, message } = req.body;

    const activity = await Activity.findOne({
      where: { id: activityId, userId: req.user.id },
    });
    if (!activity) return res.status(404).json({ error: 'Actividad no encontrada' });

    const allowedTypes = ['sos', 'fall_detected', 'inactivity', 'low_battery'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Tipo de alerta inválido' });
    }

    const { alert, notifications, contactsNotified } = await createAlertAndNotify({
      activity,
      user: req.user,
      type,
      lat,
      lng,
      message,
    });

    res.status(201).json({ alert, notifications, contactsNotified });
  } catch (error) {
    next(error);
  }
}

async function getAlert(req, res, next) {
  try {
    const alert = await Alert.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [{ model: Notification, as: 'notifications' }],
    });
    if (!alert) return res.status(404).json({ error: 'Alerta no encontrada' });
    res.json(alert);
  } catch (error) {
    next(error);
  }
}

async function resolveAlert(req, res, next) {
  try {
    const alert = await Alert.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!alert) return res.status(404).json({ error: 'Alerta no encontrada' });

    const { status } = req.body; // 'resolved' o 'false_alarm'
    alert.status = ['resolved', 'false_alarm'].includes(status) ? status : 'resolved';
    alert.resolvedAt = new Date();
    await alert.save();

    const io = getIO();
    if (io) io.to(`activity:${alert.activityId}`).emit('alert:resolved', { alertId: alert.id, status: alert.status });

    res.json(alert);
  } catch (error) {
    next(error);
  }
}

async function listAlertsForActivity(req, res, next) {
  try {
    const activity = await Activity.findOne({
      where: { id: req.params.activityId, userId: req.user.id },
    });
    if (!activity) return res.status(404).json({ error: 'Actividad no encontrada' });

    const alerts = await Alert.findAll({
      where: { activityId: activity.id },
      order: [['createdAt', 'DESC']],
    });
    res.json(alerts);
  } catch (error) {
    next(error);
  }
}

module.exports = { createAlert, getAlert, resolveAlert, listAlertsForActivity };
