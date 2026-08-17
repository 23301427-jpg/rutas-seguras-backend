const { Op } = require('sequelize');
const { Activity, Alert, User } = require('../models');
const { createAlertAndNotify } = require('../services/alertService');

const CHECK_INTERVAL_MS = 60 * 1000;

/**
 * Revisa periódicamente las actividades activas.
 *
 * Si una actividad lleva más de INACTIVITY_THRESHOLD_MINUTES
 * sin recibir ubicación, se genera una alerta de inactividad.
 */
function startInactivityChecker() {
  setInterval(async () => {
    try {
      const thresholdMinutes = parseInt(
        process.env.INACTIVITY_THRESHOLD_MINUTES || '15',
        10
      );

      if (!Number.isFinite(thresholdMinutes) || thresholdMinutes <= 0) {
        console.error(
          '[inactivityChecker] INACTIVITY_THRESHOLD_MINUTES inválido'
        );
        return;
      }

      const cutoff = new Date(
        Date.now() - thresholdMinutes * 60 * 1000
      );

      if (Number.isNaN(cutoff.getTime())) {
        console.error(
          '[inactivityChecker] Fecha cutoff inválida'
        );
        return;
      }

      const staleActivities = await Activity.findAll({
        where: {
          status: 'active',
          lastLocationAt: {
            [Op.lt]: cutoff,
          },
        },
      });

      for (const activity of staleActivities) {
        if (
          !activity.lastLocationAt ||
          Number.isNaN(new Date(activity.lastLocationAt).getTime())
        ) {
          console.warn(
            `[inactivityChecker] Actividad ${activity.id} tiene lastLocationAt inválido`
          );
          continue;
        }

        const existingOpenAlert = await Alert.findOne({
          where: {
            activityId: activity.id,
            type: 'inactivity',
            status: 'open',
          },
        });

        if (existingOpenAlert) {
          continue;
        }

        const user = await User.findByPk(activity.userId);

        if (!user) {
          console.warn(
            `[inactivityChecker] No se encontró usuario ${activity.userId}`
          );
          continue;
        }

        await createAlertAndNotify({
          activity,
          user,
          type: 'inactivity',
          lat: activity.lastLat,
          lng: activity.lastLng,
          message: `Sin señal de ubicación por más de ${thresholdMinutes} minutos`,
        });

        console.log(
          `[inactivityChecker] Alerta de inactividad creada para actividad ${activity.id}`
        );
      }
    } catch (error) {
      console.error(
        '[inactivityChecker] Error:',
        error.message
      );
    }
  }, CHECK_INTERVAL_MS);
}

module.exports = startInactivityChecker;