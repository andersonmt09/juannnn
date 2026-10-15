# Estructura del Proyecto

## Árbol completo

```
Proyecto predeterminado/
├── backend/
│   ├── src/
│   │   ├── config/          # database.js, validateEnv.js
│   │   ├── controllers/     # auth, user, metrics, axon
│   │   ├── services/        # authService, userService, emailService, metricsService, axonService
│   │   ├── repositories/    # userRepository, loginCodeRepository, endpointRepository, logRepository
│   │   ├── models/          # userModel, endpointModel, logModel, loginCodeModel
│   │   ├── dto/             # userDTO (CreateUserDTO, UpdateUserDTO, UserResponseDTO, LoginDTO)
│   │   ├── middleware/      # auth, errorHandler, rateLimiter, requestLogger
│   │   ├── routes/          # auth, user, metrics, axon, health
│   │   ├── socket/          # socket.io
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── dbInit.js
│   │   └── seed.js
│   ├── tests/               # dto.test.js, api.test.js
│   ├── package.json
│   ├── .env.example
│   └── README.md
├── frontend/
│   ├── css/styles.css
│   ├── js/
│   │   ├── core/
│   │   ├── pages/
│   │   └── app.js
│   ├── index.html
│   └── README.md
├── database/
│   └── schema.sql
├── scripts/
│   └── serve-frontend.js
├── docs/
│   ├── ARQUITECTURA (proporcionada por el usuario)
│   ├── ESTRUCTURA_PROYECTO.md
│   ├── INSTALACION_MYSQL.md
│   └── ...
├── docker-compose.yml
├── README.md
├── .gitignore
└── package.json
```

## Responsabilidades por capa (Backend)

| Capa | Archivos | Responsabilidad |
|---|---|---|
| config | `config/*.js` | Conexión a BD, validación de entorno |
| controllers | `controllers/*.js` | Recibir HTTP, devolver JSON |
| services | `services/*.js` | Reglas de negocio |
| repositories | `repositories/*.js` | Consultas SQL (CRUD) |
| models | `models/*.js` | Entidades del dominio |
| dto | `dto/*.js` | Validar/formato de datos |
| middleware | `middleware/*.js` | Autenticación, logs, rate limit, errores |
| routes | `routes/*.js` | Endpoints HTTP |

## Capas Frontend

| Carpeta | Responsabilidad |
|---|---|
| `js/core` | Cliente API, auth, UI, config |
| `js/pages` | Vistas y lógica por pantalla |
| `js/app.js` | Router y shell |
| `css/styles.css` | Diseño y temas |
