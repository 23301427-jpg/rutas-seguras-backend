const { Op } = require('sequelize');
const { Activity, Alert, User } = require('../models');
const { createAlertAndNotify } = require('../services/alertService');

const CHECK_INTERVAL_MS = 60 * 1000; // revisa cada minuto

/**
 * Revisa periódicamente las actividades activas: si no se ha recibido
 * ubicación en más de INACTIVITY_THRESHOLD_MINUTES y no existe ya una
 * alerta de inactividad abierta, crea una y notifica por SMS.
 * Esto complementa la detección de caída/inmovilidad que hace la app en
 * el teléfono vía acelerómetro (por si la app deja de responder o el
 * teléfono se apaga).
 */
function startInactivityChecker() {
  setInterval(async () => {
    try {
      const thresholdMinutes = parseInt(process.env.INACTIVITY_THRESHOLD_MINUTES || '15', 10);
      const cutoff = new Date(Date.now() - thresholdMinutes * 60 * 1000);

      const staleActivities = await Activity.findAll({
        where: {
          status: 'active',
          lastLocationAt: { [Op.lt]: cutoff, [Op.ne]: null },
        },
      });

      for (const activity of staleActivities) {
        const existingOpenAlert = await Alert.findOne({
          where: { activityId: activity.id, type: 'inactivity', status: 'open' },
        });
        if (existingOpenAlert) continue;

        const user = await User.findByPk(activity.userId);
        if (!user) continue;

        await createAlertAndNotify({
          activity,
          user,
          type: 'inactivity',
          lat: activity.lastLat,
          lng: activity.lastLng,
          message: `Sin señal de ubicación por más de ${thresholdMinutes} minutos`,
        });

        console.log(`[inactivityChecker] Alerta de inactividad creada para actividad ${activity.id}`);
      }
    } catch (error) {
      console.error('[inactivityChecker] Error:', error.message);
    }
  }, CHECK_INTERVAL_MS);
}

module.exports = startInactivityChecker;
