const { sendSMS } = require('./src/services/smsService');

const NUMERO_DESTINO = '+525536797664';

async function probarSMS() {
  console.log('Enviando SMS de prueba...');

  const resultado = await sendSMS(
    NUMERO_DESTINO,
    'Rutas Seguras: prueba de SMS con Twilio. Si recibes este mensaje, Twilio funciona correctamente.'
  );

  console.log('Resultado:');
  console.log(resultado);
}

probarSMS();