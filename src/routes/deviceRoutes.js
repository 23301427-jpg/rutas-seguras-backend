const express = require('express');
const router = express.Router();

const deviceController = require('../controllers/deviceController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', deviceController.listDevices);
router.post('/', deviceController.registerDevice);
router.put('/:id/battery', deviceController.updateBattery);

module.exports = router;
