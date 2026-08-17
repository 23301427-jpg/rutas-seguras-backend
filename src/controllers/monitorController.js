const { Activity, User, Route, Alert, LocationPing } = require('../models');

/**
 * Endpoint público (sin autenticación) para que el contacto de emergencia
 * pueda ver el seguimiento en vivo de una actividad usando el shareToken
 * generado al iniciar la actividad. No requiere que el contacto tenga cuenta.
 */
async function getLiveActivity(req, res, next) {
  try {
    const activity = await Activity.findOne({
      where: { shareToken: req.params.shareToken },
      include: [
        { model: User, attributes: ['id', 'name', 'phone'] },
        { model: Route, as: 'route' },
        { model: Alert, as: 'alerts' },
      ],
    });

    if (!activity) return res.status(404).json({ error: 'Actividad no encontrada' });

    res.json({
      id: activity.id,
      status: activity.status,
      mode: activity.mode,
      user: activity.User ? { name: activity.User.name, phone: activity.User.phone } : null,
      route: activity.route,
      lastLat: activity.lastLat,
      lastLng: activity.lastLng,
      lastLocationAt: activity.lastLocationAt,
      startedAt: activity.startedAt,
      alerts: activity.alerts,
    });
  } catch (error) {
    next(error);
  }
}

async function getLiveTrack(req, res, next) {
  try {
    const activity = await Activity.findOne({ where: { shareToken: req.params.shareToken } });
    if (!activity) return res.status(404).json({ error: 'Actividad no encontrada' });

    const pings = await LocationPing.findAll({
      where: { activityId: activity.id },
      order: [['recordedAt', 'ASC']],
      limit: 500,
    });

    res.json(pings);
  } catch (error) {
    next(error);
  }
}

module.exports = { getLiveActivity, getLiveTrack };
