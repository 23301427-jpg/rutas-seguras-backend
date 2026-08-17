require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, EmergencyContact, Route } = require('../models');

async function seed() {
  await sequelize.sync({ force: true }); // OJO: borra y recrea las tablas

  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = await User.create({
    name: 'Ana Torres',
    email: 'ana@example.com',
    password: hashedPassword,
    phone: '+525512345678',
  });

  await EmergencyContact.create({
    userId: user.id,
    name: 'Carlos Torres',
    phone: '+525536797664', // cambia esto por un número real para probar el SMS
    relationship: 'Hermano',
    isPrimary: true,
  });

  await Route.bulkCreate([
    {
      createdBy: user.id,
      name: 'Cerro de la Estrella',
      description: 'Ruta de senderismo con vistas panorámicas de la ciudad.',
      type: 'hiking',
      difficulty: 'moderada',
      distanceKm: 6.5,
      elevationGain: 320,
      coordinates: [
        { lat: 19.3325, lng: -99.0928 },
        { lat: 19.3350, lng: -99.0900 },
      ],
    },
    {
      createdBy: user.id,
      name: 'Ciclovía Bosque de Chapultepec',
      description: 'Recorrido ciclista dentro del bosque, ideal para principiantes.',
      type: 'cycling',
      difficulty: 'facil',
      distanceKm: 12,
      elevationGain: 40,
      coordinates: [
        { lat: 19.4204, lng: -99.1813 },
        { lat: 19.4150, lng: -99.1900 },
      ],
    },
  ]);

  console.log('Base de datos poblada con datos de ejemplo.');
  console.log('Usuario de prueba -> email: ana@example.com | password: password123');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
