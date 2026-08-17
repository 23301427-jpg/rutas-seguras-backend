const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const routeController = require('../controllers/routeController');
const authMiddleware = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');

// Catálogo público: cualquiera puede explorar rutas sin login
router.get('/', routeController.listRoutes);
router.get('/:id', routeController.getRoute);
router.get('/:id/reviews', routeController.listReviews);

// Crear/editar rutas y reseñas requiere estar autenticado
router.post(
  '/',
  authMiddleware,
  [
    body('name').notEmpty().withMessage('El nombre es obligatorio'),
    body('type').isIn(['hiking', 'cycling']).withMessage('Tipo inválido'),
  ],
  validate,
  routeController.createRoute
);

router.put('/:id', authMiddleware, routeController.updateRoute);
router.delete('/:id', authMiddleware, routeController.deleteRoute);

router.post(
  '/:id/reviews',
  authMiddleware,
  [body('rating').isInt({ min: 1, max: 5 }).withMessage('La calificación debe ser de 1 a 5')],
  validate,
  routeController.createReview
);

module.exports = router;
