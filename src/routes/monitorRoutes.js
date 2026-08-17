const express = require('express');
const router = express.Router();

const monitorController = require('../controllers/monitorController');

// Estas rutas son públicas a propósito: el contacto de emergencia accede
// mediante un enlace con shareToken, sin necesidad de crear una cuenta.
router.get('/:shareToken', monitorController.getLiveActivity);
router.get('/:shareToken/track', monitorController.getLiveTrack);

module.exports = router;
