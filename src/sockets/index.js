const { setIO } = require('./socketInstance');

function initSockets(io) {
  setIO(io);

  console.log('=================================');
  console.log('SOCKET.IO INICIALIZADO');
  console.log('=================================');

  io.on('connection', (socket) => {
    console.log('🔌 SOCKET CONECTADO:', socket.id);

    socket.on('join:activity', (activityId) => {
      if (!activityId) {
        console.log('⚠️ JOIN SIN ACTIVITY ID');
        return;
      }

      const room = `activity:${activityId}`;

      socket.join(room);

      console.log('=================================');
      console.log('👤 SOCKET UNIÉNDOSE A ACTIVIDAD');
      console.log('Socket:', socket.id);
      console.log('Activity:', activityId);
      console.log('Room:', room);
      console.log('=================================');
    });

    socket.on('leave:activity', (activityId) => {
      if (!activityId) return;

      const room = `activity:${activityId}`;

      socket.leave(room);

      console.log('🚪 SOCKET SALIÓ DE:', room);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 SOCKET DESCONECTADO:', socket.id);
      console.log('Razón:', reason);
    });
  });
}

module.exports = initSockets;
