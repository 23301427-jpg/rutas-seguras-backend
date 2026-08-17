# Rutas Seguras — Backend

Backend para la app de senderismo/ciclismo con monitoreo de seguridad en tiempo real.
Construido con **Node.js + Express + Sequelize (SQLite) + Socket.io + Twilio (SMS)**.

## ¿Por qué SQLite?

Para que el proyecto funcione "de una" sin instalar un motor de base de datos aparte.
El archivo `database.sqlite` se crea solo al arrancar el servidor. Si más adelante
quieren usar PostgreSQL/MySQL, solo hay que cambiar `src/config/database.js`
(Sequelize soporta el cambio casi sin tocar el resto del código).

## Instalación

```bash
cd rutas-seguras-backend
npm install
cp .env.example .env
```

Edita `.env` si quieres activar el envío real de SMS (ver sección Twilio más abajo).
Si no lo configuras, el sistema **simula** el envío y lo imprime en consola —
así puedes probar todo el flujo sin gastar en SMS reales.

## Levantar el servidor

```bash
npm run dev      # con nodemon (recarga automática)
# o
npm start
```

El servidor corre en `http://localhost:3000` (o el puerto que definas en `.env`).

## (Opcional) Poblar con datos de ejemplo

```bash
npm run seed
```

Esto crea un usuario de prueba:
- **email:** `ana@example.com`
- **password:** `password123`

con un contacto de emergencia y dos rutas de ejemplo.

## Configurar Twilio para SMS reales (opcional)

1. Crea una cuenta en https://www.twilio.com/ (tiene nivel gratuito de prueba).
2. Copia tu `Account SID`, `Auth Token` y compra/activa un número de envío.
3. Ponlos en `.env`:
   ```
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
   TWILIO_FROM_NUMBER=+1xxxxxxxxxx
   ```
4. Reinicia el servidor. A partir de ahí, cualquier alerta (SOS, caída,
   inactividad, batería baja) enviará un SMS real al contacto de emergencia.

## Estructura del proyecto

```
src/
  config/       -> conexión a la base de datos
  models/       -> entidades (Sequelize) y sus asociaciones
  controllers/  -> lógica de cada endpoint
  routes/       -> definición de endpoints Express
  middleware/   -> autenticación (JWT) y manejo de errores
  services/     -> smsService (Twilio) y alertService (lógica de negocio de alertas)
  sockets/      -> Socket.io para tracking en vivo
  jobs/         -> tarea periódica que detecta inactividad prolongada
  utils/        -> jwt.js, seed.js
server.js       -> arranca HTTP + Socket.io + sincroniza base de datos
```

## Modelo de datos (entidades)

| Entidad             | Descripción                                                            |
|---------------------|--------------------------------------------------------------------------|
| **User**             | Usuario/deportista de la app.                                          |
| **EmergencyContact** | Contacto(s) de emergencia vinculados a la cuenta. Reciben el SMS.      |
| **Device**           | El smartphone del usuario (reemplaza al wearable original).            |
| **Route**            | Ruta del catálogo público (senderismo/ciclismo).                       |
| **Review**           | Reseña/calificación (1-5) que un usuario deja sobre una ruta.          |
| **Activity**         | Un "viaje"/salida: activar modo actividad, trackear, finalizar.        |
| **LocationPing**     | Cada punto GPS enviado durante una actividad activa.                   |
| **Alert**            | Alerta/incidente: `sos`, `fall_detected`, `inactivity`, `low_battery`. |
| **Notification**     | Registro de cada SMS enviado a un contacto por una alerta.             |

## Flujo clave: detección de accidente → SMS automático

1. La app activa **"modo actividad"** → `POST /api/activities` (status: active).
2. Mientras camina/pedalea, la app envía ubicación periódicamente:
   `POST /api/activities/:id/location` (puede incluir `accelMagnitude` del
   acelerómetro y `batteryLevel`).
   - Si `accelMagnitude` supera el umbral configurado, el backend
     **automáticamente** crea una alerta `fall_detected` y envía SMS.
   - Si `batteryLevel` baja de 15%, se crea alerta `low_battery`.
3. Si el usuario presiona el botón SOS en pantalla, la app llama:
   `POST /api/alerts` con `type: "sos"`.
4. En **cualquiera** de los casos anteriores, el backend:
   - Guarda la alerta (`Alert`).
   - Busca todos los `EmergencyContact` del usuario.
   - Envía un SMS a cada uno vía Twilio (o lo simula si no está configurado),
     incluyendo la ubicación (link a Google Maps) y un link de seguimiento
     en vivo (`FRONTEND_BASE_URL/monitor/:shareToken`).
   - Guarda cada envío en `Notification`.
   - Emite el evento `alert:new` por Socket.io a quien esté viendo el
     seguimiento en vivo de esa actividad.
5. Un job en segundo plano (`inactivityChecker.js`) revisa cada minuto si
   una actividad activa dejó de reportar ubicación por más de N minutos
   (configurable en `.env`) y, si es así, también dispara alerta + SMS.
   Esto cubre el caso donde el teléfono se apaga o pierde señal.

## Autenticación

Todas las rutas privadas usan JWT. Inclúyelo así en cada request:

```
Authorization: Bearer <token>
```

El token se obtiene en `/api/auth/register` o `/api/auth/login`.

## Endpoints principales

### Auth
| Método | Endpoint          | Descripción                    | Auth |
|--------|--------------------|---------------------------------|------|
| POST   | /api/auth/register | Crear cuenta                   | No   |
| POST   | /api/auth/login    | Iniciar sesión                 | No   |
| GET    | /api/auth/me        | Perfil del usuario autenticado | Sí   |
| PUT    | /api/auth/me        | Editar perfil                  | Sí   |

### Contactos de emergencia
| Método | Endpoint              | Descripción                | Auth |
|--------|-------------------------|------------------------------|------|
| GET    | /api/contacts           | Listar mis contactos        | Sí   |
| POST   | /api/contacts           | Agregar contacto             | Sí   |
| PUT    | /api/contacts/:id        | Editar contacto              | Sí   |
| DELETE | /api/contacts/:id        | Eliminar contacto            | Sí   |

### Dispositivos
| Método | Endpoint                    | Descripción                 | Auth |
|--------|-------------------------------|-------------------------------|------|
| GET    | /api/devices                  | Listar mis dispositivos      | Sí   |
| POST   | /api/devices                  | Registrar smartphone         | Sí   |
| PUT    | /api/devices/:id/battery      | Actualizar nivel de batería  | Sí   |

### Rutas (catálogo)
| Método | Endpoint                  | Descripción                             | Auth |
|--------|------------------------------|--------------------------------------------|------|
| GET    | /api/routes                  | Listar/buscar rutas (`?type=&difficulty=&search=`) | No |
| GET    | /api/routes/:id               | Detalle de una ruta + reseñas          | No   |
| POST   | /api/routes                  | Crear ruta                              | Sí   |
| PUT    | /api/routes/:id               | Editar ruta (solo dueño)                | Sí   |
| DELETE | /api/routes/:id               | Eliminar ruta (solo dueño)              | Sí   |
| GET    | /api/routes/:id/reviews       | Listar reseñas de la ruta               | No   |
| POST   | /api/routes/:id/reviews       | Calificar/reseñar una ruta              | Sí   |

### Actividades (bitácora / tracking)
| Método | Endpoint                        | Descripción                                        | Auth |
|--------|------------------------------------|------------------------------------------------------|------|
| POST   | /api/activities                    | Iniciar actividad (`routeId?`, `mode`)             | Sí   |
| GET    | /api/activities                    | Historial de actividades del usuario                | Sí   |
| GET    | /api/activities/:id                 | Detalle de una actividad                            | Sí   |
| PUT    | /api/activities/:id/status          | Cambiar estado (active/paused/completed/cancelled) | Sí   |
| POST   | /api/activities/:id/location        | Enviar ping GPS (+accelMagnitude, batteryLevel)     | Sí   |
| GET    | /api/activities/:id/track           | Obtener el trazado completo (todos los pings)      | Sí   |

### Alertas
| Método | Endpoint                      | Descripción                                  | Auth |
|--------|----------------------------------|-------------------------------------------------|------|
| POST   | /api/alerts                      | Crear alerta manual (SOS, etc.) → dispara SMS  | Sí   |
| GET    | /api/alerts/:id                   | Detalle de una alerta + notificaciones enviadas | Sí   |
| PUT    | /api/alerts/:id/resolve           | Marcar como resuelta / falsa alarma            | Sí   |
| GET    | /api/alerts/activity/:activityId  | Listar alertas de una actividad                | Sí   |

### Monitoreo en vivo (público — para la plataforma web del contacto)
| Método | Endpoint                          | Descripción                                    | Auth |
|--------|--------------------------------------|---------------------------------------------------|------|
| GET    | /api/monitor/:shareToken             | Estado en vivo de la actividad (ubicación, alertas) | No |
| GET    | /api/monitor/:shareToken/track       | Trazado GPS de la actividad                     | No   |

## Tiempo real (Socket.io)

La plataforma web de monitoreo se conecta a Socket.io y hace:

```js
const socket = io('http://localhost:3000');
socket.emit('join:activity', activityId);

socket.on('location:update', (data) => { /* actualizar mapa */ });
socket.on('alert:new', (data) => { /* mostrar alerta urgente */ });
socket.on('alert:resolved', (data) => { /* quitar alerta */ });
socket.on('activity:status', (data) => { /* actividad pausada/finalizada */ });
```

## Ejemplo rápido con curl

```bash
# 1. Registro
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana","email":"ana2@example.com","password":"123456","phone":"+525511111111"}'

# 2. Agregar contacto de emergencia (usa el token recibido arriba)
curl -X POST http://localhost:3000/api/contacts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{"name":"Luis","phone":"+525522222222","relationship":"Papá","isPrimary":true}'

# 3. Iniciar actividad
curl -X POST http://localhost:3000/api/activities \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{"mode":"hiking"}'

# 4. Presionar SOS (usa el activityId recibido arriba)
curl -X POST http://localhost:3000/api/alerts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{"activityId":"ID_DE_LA_ACTIVIDAD","type":"sos","lat":19.43,"lng":-99.13}'
```

Con esto último, revisa la consola del servidor: verás el SMS simulado (o
recibido de verdad si configuraste Twilio) con la ubicación y el link de
seguimiento en vivo.
