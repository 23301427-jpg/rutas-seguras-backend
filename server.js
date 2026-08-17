require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const app = require('./src/app');
const { sequelize } = require('./src/models');
const initSockets = require('./src/sockets');
const startInactivityChecker = require('./src/jobs/inactivityChecker');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*' },
});
initSockets(io);

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente.');

    // sync crea las tablas automáticamente si no existen (ideal para este
    // proyecto con SQLite). Para producción se recomendarían migraciones.
    await sequelize.sync();
    console.log('Modelos sincronizados con la base de datos.');

    startInactivityChecker();

    server.listen(PORT, () => {
      console.log(`Rutas Seguras backend corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

start();
