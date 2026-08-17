const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const contactRoutes = require('./routes/contactRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const routeRoutes = require('./routes/routeRoutes');
const activityRoutes = require('./routes/activityRoutes');
const alertRoutes = require('./routes/alertRoutes');
const monitorRoutes = require('./routes/monitorRoutes');

const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'rutas-seguras-backend' }));

app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/monitor', monitorRoutes); // público, para la plataforma web de seguimiento

app.use((req, res) => res.status(404).json({ error: 'Recurso no encontrado' }));
app.use(errorHandler);

module.exports = app;
