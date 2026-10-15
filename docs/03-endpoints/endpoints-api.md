# 03 · Endpoints de la API

Base: `http://localhost:4000/api` · Formato: JSON · Autenticación: `Authorization: Bearer <accessToken>`

Cada endpoint indica el **RF** que implementa y el **controlador → servicio → modelo** que lo atiende, para seguir la petición por el código.

Respuesta exitosa: `{ "ok": true, ... }` · Respuesta de error: `{ "ok": false, "message": "...", "errors": [...] }`

## Autenticación — `/api/auth` (públicos)

Archivo de rutas: `backend/src/routes/auth.routes.js` · Controlador: `auth.controller.js` · Servicio: `auth.service.js`

| Método | Ruta | RF | Cuerpo | Respuesta | Errores |
|---|---|---|---|---|---|
| POST | `/auth/register` | RF-01 | `{ name, email, password }` | 201 `{ requiresVerification, email }` | 400, 409, 429 |
| POST | `/auth/register/verify` | RF-02 | `{ email, code }` | 200 `{ verified: true }` | 400, 401, 429 |
| POST | `/auth/register/resend-code` | RF-04 | `{ email }` | 200 `{ message }` | 400, 403, 404 |
| POST | `/auth/login` | RF-03 | `{ email, password }` | 200 `{ requiresVerification, email }` | 400, 401, 403, 429 |
| POST | `/auth/login/verify` | RF-03 | `{ email, code }` | 200 `{ accessToken, refreshToken, user }` | 400, 401, 429 |
| POST | `/auth/login/resend-code` | RF-04 | `{ email }` | 200 `{ message }` | 400, 403, 404 |
| POST | `/auth/refresh-token` | RF-05 | `{ refreshToken }` | 200 `{ accessToken, refreshToken, user }` | 400, 401 |

## Usuarios — `/api/users` (requieren sesión)

Archivo de rutas: `user.routes.js` · Controlador: `user.controller.js` · Servicio: `user.service.js` · Modelo: `user.model.js`

| Método | Ruta | RF | Rol | Cuerpo / Parámetros | Respuesta |
|---|---|---|---|---|---|
| GET | `/users` | RF-06 | Cualquiera | `?page=1&limit=50&all=true` (`all` solo admin) | 200 `{ data: [User], meta }` |
| GET | `/users/:id` | RF-06 | Cualquiera | — | 200 `{ data: User }` · 404 |
| POST | `/users` | RF-07 | admin | `{ name, email, password, role }` | 201 `{ data: User }` · 400, 409 |
| PUT | `/users/:id` | RF-08 | admin | `{ name?, email?, role? }` | 200 `{ data: User }` · 400, 404, 409 |
| PATCH | `/users/:id/password` | RF-09 | Propio o admin | `{ password }` | 200 `{ message }` · 400, 403, 404 |
| DELETE | `/users/:id` | RF-10 | admin | — | 200 `{ message }` · 400, 404 |

Objeto `User` devuelto (nunca incluye la contraseña):
```json
{ "id": 1, "name": "Ana", "email": "ana@correo.com", "role": "user", "emailVerified": true, "isSample": false, "createdDate": "2026-10-15T17:00:00.000Z" }
```

## Endpoints monitoreados — `/api/endpoints` (requieren sesión)

Archivo de rutas: `endpoint.routes.js` · Controlador: `endpoint.controller.js` · Servicio: `endpoint.service.js` · Modelo: `endpoint.model.js`

| Método | Ruta | RF | Rol | Cuerpo | Respuesta |
|---|---|---|---|---|---|
| GET | `/endpoints` | RF-12 | Cualquiera | — | 200 `{ data: [Endpoint] }` |
| POST | `/endpoints` | RF-13 | admin | `{ name, path, method, description? }` | 201 `{ data: Endpoint }` · 400 |
| DELETE | `/endpoints/:id` | RF-13 | admin | — | 200 `{ message }` · 404 |

## Métricas — `/api/metrics` (requiere sesión)

| Método | Ruta | RF | Respuesta |
|---|---|---|---|
| GET | `/metrics/dashboard` | RF-11 | 200 `{ data: { summary, requestsByStatus, requestsByMethod, recentRequests } }` |

## Estado — `/api/health` (público)

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/health` | 200 `{ ok: true, database: "ok" }` · 503 si la base de datos externa no responde |

## Códigos de estado usados

| Código | Significado |
|---|---|
| 200 / 201 | Correcto / Creado |
| 400 | Datos inválidos (validación del DTO) o regla de negocio |
| 401 | Sin sesión, token inválido, credenciales o código incorrecto |
| 403 | Sin permisos (rol) o cuenta desactivada / sin verificar |
| 404 | Recurso o ruta no encontrada |
| 409 | Correo ya registrado |
| 429 | Demasiados intentos (RNF-03, RNF-04) |
| 500 / 503 | Error interno / base de datos no disponible |

## Registro automático (RF-14)

Todas las peticiones pasan por `middlewares/request-logger.middleware.js`, que guarda método, ruta, estado, latencia, IP y usuario en la tabla `request_logs`.
