const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const alertController = require('../controllers/alertController');
const authMiddleware = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');

router.use(authMiddleware);

router.post(
  '/',
  [
    body('activityId').notEmpty().withMessage('activityId es obligatorio'),
    body('type').isIn(['sos', 'fall_detected', 'inactivity', 'low_battery']).withMessage('Tipo inválido'),
  ],
  validate,
  alertController.createAlert
);

router.get('/:id', alertController.getAlert);
router.put('/:id/resolve', alertController.resolveAlert);
router.get('/activity/:activityId', alertController.listAlertsForActivity);

module.exports = router;
