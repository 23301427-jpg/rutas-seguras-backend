const { io } = require('socket.io-client');

const ACTIVITY_ID = '1fbe1e4b-8ec2-47fb-b699-5a75a3590940';

console.log('Conectando a Rutas Seguras...');

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('=================================');
  console.log('✓ CONECTADO A SOCKET.IO');
  console.log('Socket ID:', socket.id);
  console.log('Actividad:', ACTIVITY_ID);
  console.log('=================================');

  socket.emit('join:activity', ACTIVITY_ID);

  console.log('✓ Unido a la actividad');
  console.log('Esperando eventos...');
});

socket.on('location:update', (data) => {
  console.log('');
  console.log('📍 LOCATION UPDATE');
  console.log('Actividad:', data.activityId);
  console.log('Latitud:', data.lat);
  console.log('Longitud:', data.lng);
  console.log('Altitud:', data.altitude);
  console.log('Velocidad:', data.speed);
  console.log('Batería:', data.batteryLevel);
});

socket.on('activity:status', (data) => {
  console.log('');
  console.log('🔄 ACTIVITY STATUS');
  console.log('Actividad:', data.activityId);
  console.log('Estado:', data.status);
});

socket.on('alert:new', (data) => {
  console.log('');
  console.log('🚨 NUEVA ALERTA');
  console.log('Actividad:', data.activityId);
  console.log('Tipo:', data.alert.type);
  console.log('Mensaje:', data.alert.message);
  console.log('Ubicación:', data.alert.lat, data.alert.lng);
});

socket.on('alert:resolved', (data) => {
  console.log('');
  console.log('✅ ALERTA RESUELTA');
  console.log('Alerta:', data.alertId);
  console.log('Estado:', data.status);
});

socket.on('disconnect', () => {
  console.log('❌ Desconectado del servidor');
});

socket.on('connect_error', (error) => {
  console.log('❌ Error de conexión:', error.message);
});