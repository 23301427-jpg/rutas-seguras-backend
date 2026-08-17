const { Op } = require('sequelize');
const { Route, Review, User } = require('../models');

async function listRoutes(req, res, next) {
  try {
    const { type, difficulty, search } = req.query;
    const where = {};

    if (type) where.type = type;
    if (difficulty) where.difficulty = difficulty;
    if (search) where.name = { [Op.like]: `%${search}%` };

    const routes = await Route.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    res.json(routes);
  } catch (error) {
    next(error);
  }
}

async function getRoute(req, res, next) {
  try {
    const route = await Route.findByPk(req.params.id, {
      include: [{ model: Review, as: 'reviews' }],
    });
    if (!route) return res.status(404).json({ error: 'Ruta no encontrada' });
    res.json(route);
  } catch (error) {
    next(error);
  }
}

async function createRoute(req, res, next) {
  try {
    const { name, description, type, difficulty, distanceKm, elevationGain, coordinates } = req.body;

    const route = await Route.create({
      createdBy: req.user.id,
      name,
      description,
      type,
      difficulty,
      distanceKm,
      elevationGain,
      coordinates,
    });

    res.status(201).json(route);
  } catch (error) {
    next(error);
  }
}

async function updateRoute(req, res, next) {
  try {
    const route = await Route.findByPk(req.params.id);
    if (!route) return res.status(404).json({ error: 'Ruta no encontrada' });
    if (route.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para editar esta ruta' });
    }

    const fields = ['name', 'description', 'type', 'difficulty', 'distanceKm', 'elevationGain', 'coordinates'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) route[field] = req.body[field];
    });

    await route.save();
    res.json(route);
  } catch (error) {
    next(error);
  }
}

async function deleteRoute(req, res, next) {
  try {
    const route = await Route.findByPk(req.params.id);
    if (!route) return res.status(404).json({ error: 'Ruta no encontrada' });
    if (route.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta ruta' });
    }

    await route.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function listReviews(req, res, next) {
  try {
    const reviews = await Review.findAll({
      where: { routeId: req.params.id },
      include: [{ model: User, as: 'author', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(reviews);
  } catch (error) {
    next(error);
  }
}

async function createReview(req, res, next) {
  try {
    const route = await Route.findByPk(req.params.id);
    if (!route) return res.status(404).json({ error: 'Ruta no encontrada' });

    const { rating, comment } = req.body;

    const review = await Review.create({
      routeId: route.id,
      userId: req.user.id,
      rating,
      comment,
    });

    // Recalcular promedio de calificación de la ruta
    const allReviews = await Review.findAll({ where: { routeId: route.id } });
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    route.avgRating = Math.round(avg * 10) / 10;
    route.ratingsCount = allReviews.length;
    await route.save();

    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listRoutes,
  getRoute,
  createRoute,
  updateRoute,
  deleteRoute,
  listReviews,
  createReview,
};
