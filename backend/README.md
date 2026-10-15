# Backend - AXON Stack Flow (API REST)

API REST construida con **Node.js + Express** y arquitectura por capas.

## Estructura de carpetas

```
backend/
├── src/
│   ├── config/          # Configuración de base de datos y entorno
│   ├── controllers/     # Reciben HTTP y devuelven respuestas JSON
│   ├── services/        # Reglas de negocio y validaciones
│   ├── repositories/    # Acceso a datos (CRUD SQL)
│   ├── models/          # Entidades del dominio
│   ├── dto/             # Objetos de transferencia (entrada/salida)
│   ├── middleware/      # Auth, rate limit, logging, errores
│   ├── routes/          # Definición de endpoints
│   ├── socket/          # Socket.IO
│   ├── app.js           # Configuración de Express
│   ├── server.js        # Punto de entrada
│   ├── dbInit.js        # Crea la BD y las tablas
│   └── seed.js          # Datos iniciales (usuarios demo)
├── tests/               # Pruebas (node:test)
├── package.json
├── .env.example
└── .env
```

## Variables de entorno (.env)

Ver `.env.example`. Las obligatorias: `JWT_SECRET`, `JWT_REFRESH_SECRET` (≥16 caracteres).

## Comandos

```bash
npm install
npm run db:init     # crea base de datos y tablas
npm run seed        # crea usuarios demo
npm start           # inicia el servidor (puerto 4000)
npm run dev         # desarrollo con nodemon
npm test            # pruebas (backend debe estar corriendo)
```

## Endpoints principales

- `POST /api/auth/login`, `verify-code`, `register`, `verify-registration`
- `POST /api/auth/resend-code`, `resend-registration`, `refresh-token`
- `GET/POST/PUT/PATCH/DELETE /api/users`
- `GET /api/metrics/dashboard`
- `GET/POST/DELETE /api/axon/endpoints`
- `GET /api/health`

## Reglas de negocio clave

- Rate limiting: 5 intentos / 15 min por IP.
- Código de verificación: 6 dígitos, expira en 5 min, 5 intentos.
- Usuarios demo (`is_sample=1`) protegidos.
- Eliminación lógica (`role='inactive'`).
- No puedes eliminar tu propio usuario.
