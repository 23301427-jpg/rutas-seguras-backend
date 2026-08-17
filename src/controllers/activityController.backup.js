const { Activity, LocationPing, Route, Alert, User } = require('../models');
const { getIO } = require('../sockets/socketInstance');
const { createAlertAndNotify } = require('../services/alertService');

// Umbral simple de aceleración para sugerir posible caída, en caso de que
// la app envíe el dato crudo en vez de resolverlo localmente.
const FALL_ACCEL_THRESHOLD = 25; // m/s^2 aprox.

async function startActivity(req, res, next) {
  try {
    const { routeId, mode } = req.body;

    if (routeId) {
      const route = await Route.findByPk(routeId);
      if (!route) return res.status(404).json({ error: 'Ruta no encontrada' });
    }

    const activity = await Activity.create({
      userId: req.user.id,
      routeId: routeId || null,
      mode: mode || 'hiking',
      status: 'active',
      startedAt: new Date(),
    });

    res.status(201).json(activity);
  } catch (error) {
    next(error);
  }
}

async function listActivities(req, res, next) {
  try {
    const activities = await Activity.findAll({
      where: { userId: req.user.id },
      include: [{ model: Route, as: 'route' }],
      order: [['createdAt', 'DESC']],
    });
    res.json(activities);
  } catch (error) {
    next(error);
  }
}

async function getActivity(req, res, next) {
  try {
    const activity = await Activity.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [{ model: Route, as: 'route' }, { model: Alert, as: 'alerts' }],
    });
    if (!activity) return res.status(404).json({ error: 'Actividad no encontrada' });
    res.json(activity);
  } catch (error) {
    next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const activity = await Activity.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!activity) return res.status(404).json({ error: 'Actividad no encontrada' });

    const { status, userRatingOfRoute } = req.body;
    const allowed = ['active', 'paused', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    activity.status = status;
    if (status === 'completed' || status === 'cancelled') {
      activity.endedAt = new Date();
    }
    if (userRatingOfRoute) {
      activity.userRatingOfRoute = userRatingOfRoute;
    }
    await activity.save();

    const io = getIO();
    if (io) io.to(`activity:${activity.id}`).emit('activity:status', { activityId: activity.id, status });

    res.json(activity);
  } catch (error) {
    next(error);
  }
}

/**
 * Recibe un punto de ubicación mientras la actividad está activa.
 * También recibe (opcionalmente) accelMagnitude: si el valor supera el
 * umbral, se dispara automáticamente una alerta de "posible caída" y el
 * SMS al contacto de emergencia, ademas de lo que la app ya detecte localmente.
 */
async function addLocationPing(req, res, next) {
  try {
    const activity = await Activity.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!activity) return res.status(404).json({ error: 'Actividad no encontrada' });

    if (!['active', 'paused'].includes(activity.status)) {
      return res.status(400).json({ error: 'La actividad no está en curso' });
    }

    const { lat, lng, altitude, speed, accelMagnitude, batteryLevel } = req.body;

    const ping = await LocationPing.create({
      activityId: activity.id,
      lat,
      lng,
      altitude,
      speed,
      accelMagnitude,
      batteryLevel,
      recordedAt: new Date(),
    });

    activity.lastLat = lat;
    activity.lastLng = lng;
    activity.lastLocationAt = new Date();
    await activity.save();

    const io = getIO();
    if (io) {
      io.to(`activity:${activity.id}`).emit('location:update', {
        activityId: activity.id,
        lat,
        lng,
        altitude,
        speed,
        batteryLevel,
        recordedAt: ping.recordedAt,
      });
    }

    // Detección server-side de respaldo por aceleración brusca
    let autoAlert = null;
    if (typeof accelMagnitude === 'number' && accelMagnitude >= FALL_ACCEL_THRESHOLD) {
      const user = await User.findByPk(req.user.id);
      const result = await createAlertAndNotify({
        activity,
        user,
        type: 'fall_detected',
        lat,
        lng,
        message: 'Detectado automáticamente por lectura de acelerómetro',
      });
      autoAlert = result.alert;
    }

    // Batería baja también genera alerta (una sola vez por bajada de umbral,
    // simplificado: siempre que llegue bajo 15%)
    if (typeof batteryLevel === 'number' && batteryLevel <= 15) {
      const user = await User.findByPk(req.user.id);
      await createAlertAndNotify({
        activity,
        user,
        type: 'low_battery',
        lat,
        lng,
        message: `Batería del teléfono al ${batteryLevel}%`,
      });
    }

    res.status(201).json({ ping, autoAlert });
  } catch (error) {
    next(error);
  }
}

async function getTrack(req, res, next) {
  try {
    const activity = await Activity.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!activity) return res.status(404).json({ error: 'Actividad no encontrada' });

    const pings = await LocationPing.findAll({
      where: { activityId: activity.id },
      order: [['recordedAt', 'ASC']],
    });

    res.json(pings);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  startActivity,
  listActivities,
  getActivity,
  updateStatus,
  addLocationPing,
  getTrack,
};
