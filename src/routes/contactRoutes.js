const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const contactController = require('../controllers/contactController');
const authMiddleware = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');

router.use(authMiddleware);

router.get('/', contactController.listContacts);

router.post(
  '/',
  [
    body('name').notEmpty().withMessage('El nombre es obligatorio'),
    body('phone').notEmpty().withMessage('El teléfono es obligatorio'),
  ],
  validate,
  contactController.createContact
);

router.put('/:id', contactController.updateContact);
router.delete('/:id', contactController.deleteContact);

module.exports = router;
