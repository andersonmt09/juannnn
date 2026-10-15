# Backend

API REST en Node.js y Express.

## Flujo de una petición

```
routes/ → middlewares/ → controllers/ → services/ → models/ → MySQL externa
```

| Carpeta | Contenido |
|---|---|
| `config/` | Lectura del `.env` y conexión a la base de datos |
| `constants/` | Roles y parámetros de seguridad |
| `routes/` | Endpoints. `index.js` los agrupa bajo `/api` |
| `middlewares/` | Autenticación, roles, validación, límite de intentos, registro de peticiones y errores |
| `controllers/` | Reciben `req`, llaman al servicio y responden |
| `services/` | Reglas de negocio |
| `models/` | Una clase por tabla con sus consultas SQL |
| `dtos/` | Validan la entrada y definen qué datos se devuelven |
| `utils/` | `HttpError`, `asyncHandler` y validadores |

## Comandos

| Comando | Descripción |
|---|---|
| `npm install` | Instala las dependencias |
| `npm start` | Inicia la API en http://localhost:4000/api |
| `npm run dev` | Inicia y reinicia al guardar cambios |
| `npm run create-admin -- "Nombre" correo "Contraseña"` | Crea un administrador |
| `npm test` | Pruebas unitarias |
| `npm run test:integration` | Pruebas de la API (servidor encendido) |
