const { EmergencyContact } = require('../models');

async function listContacts(req, res, next) {
  try {
    const contacts = await EmergencyContact.findAll({ where: { userId: req.user.id } });
    res.json(contacts);
  } catch (error) {
    next(error);
  }
}

async function createContact(req, res, next) {
  try {
    const { name, phone, relationship, isPrimary } = req.body;

    // Si se marca como principal, desmarcar los demás
    if (isPrimary) {
      await EmergencyContact.update(
        { isPrimary: false },
        { where: { userId: req.user.id } }
      );
    }

    const contact = await EmergencyContact.create({
      userId: req.user.id,
      name,
      phone,
      relationship,
      isPrimary: !!isPrimary,
    });

    res.status(201).json(contact);
  } catch (error) {
    next(error);
  }
}

async function updateContact(req, res, next) {
  try {
    const contact = await EmergencyContact.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!contact) return res.status(404).json({ error: 'Contacto no encontrado' });

    const { name, phone, relationship, isPrimary } = req.body;

    if (isPrimary) {
      await EmergencyContact.update(
        { isPrimary: false },
        { where: { userId: req.user.id } }
      );
    }

    if (name !== undefined) contact.name = name;
    if (phone !== undefined) contact.phone = phone;
    if (relationship !== undefined) contact.relationship = relationship;
    if (isPrimary !== undefined) contact.isPrimary = isPrimary;

    await contact.save();
    res.json(contact);
  } catch (error) {
    next(error);
  }
}

async function deleteContact(req, res, next) {
  try {
    const contact = await EmergencyContact.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!contact) return res.status(404).json({ error: 'Contacto no encontrado' });

    await contact.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = { listContacts, createContact, updateContact, deleteContact };
