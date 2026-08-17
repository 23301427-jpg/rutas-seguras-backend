require('dotenv').config();

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = process.env;

const isConfigured = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM_NUMBER;

let client = null;
if (isConfigured) {
  const twilio = require('twilio');
  client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

/**
 * Envía un SMS al número indicado.
 * Si Twilio no está configurado (no hay credenciales en .env), el envío se
 * simula: se imprime el mensaje en consola y se retorna como "enviado" para
 * no bloquear el flujo de desarrollo/pruebas.
 */
async function sendSMS(toNumber, message) {
  if (!toNumber) {
    return { success: false, error: 'Número de destino no proporcionado' };
  }

  if (!isConfigured) {
    console.log('--- [SMS SIMULADO] ---');
    console.log(`Para: ${toNumber}`);
    console.log(`Mensaje: ${message}`);
    console.log('-----------------------');
    return { success: true, simulated: true, sid: `SIMULATED-${Date.now()}` };
  }

  try {
    const result = await client.messages.create({
      body: message,
      from: TWILIO_FROM_NUMBER,
      to: toNumber,
    });
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('Error enviando SMS:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { sendSMS };
