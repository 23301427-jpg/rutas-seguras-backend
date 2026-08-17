const { Device } = require('../models');

async function registerDevice(req, res, next) {
  try {
    const { platform, pushToken, batteryLevel } = req.body;

    const device = await Device.create({
      userId: req.user.id,
      platform,
      pushToken,
      batteryLevel,
      lastSeenAt: new Date(),
    });

    res.status(201).json(device);
  } catch (error) {
    next(error);
  }
}

async function updateBattery(req, res, next) {
  try {
    const device = await Device.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!device) return res.status(404).json({ error: 'Dispositivo no encontrado' });

    const { batteryLevel } = req.body;
    device.batteryLevel = batteryLevel;
    device.lastSeenAt = new Date();
    await device.save();

    res.json(device);
  } catch (error) {
    next(error);
  }
}

async function listDevices(req, res, next) {
  try {
    const devices = await Device.findAll({ where: { userId: req.user.id } });
    res.json(devices);
  } catch (error) {
    next(error);
  }
}

module.exports = { registerDevice, updateBattery, listDevices };
