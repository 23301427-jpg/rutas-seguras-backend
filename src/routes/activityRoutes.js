const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const activityController = require('../controllers/activityController');
const authMiddleware = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');

router.use(authMiddleware);

router.post('/', activityController.startActivity);
router.get('/', activityController.listActivities);
router.get('/:id', activityController.getActivity);
router.put('/:id/status', activityController.updateStatus);

router.post(
  '/:id/location',
  [
    body('lat').isFloat().withMessage('lat inválida'),
    body('lng').isFloat().withMessage('lng inválida'),
  ],
  validate,
  activityController.addLocationPing
);

router.get('/:id/track', activityController.getTrack);

module.exports = router;
