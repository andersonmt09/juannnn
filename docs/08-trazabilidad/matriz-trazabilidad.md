# 08 · Matriz de Trazabilidad

Une cada requerimiento con todo lo que se construyó para cumplirlo. Se lee por filas: **RF → Caso de uso → Endpoint → Tabla → Clases → Secuencia / Actividad → Vista**.

| RF | Caso de uso | Endpoint(s) | Tabla(s) | Controlador → Servicio → Modelo | Secuencia | Actividad | Vista (frontend) |
|---|---|---|---|---|---|---|---|
| RF-01 Registrar usuario | CU-01 | `POST /auth/register` | users, login_verification_codes | auth.controller → auth.service → User, VerificationCode | SD-02 | AD-01 | `views/auth/register.view.js` |
| RF-02 Verificar correo | CU-01 | `POST /auth/register/verify` | login_verification_codes, users | auth.controller → auth.service → VerificationCode, User | SD-02 | AD-01 | `views/auth/verify.view.js` |
| RF-03 Login dos pasos | CU-02 | `POST /auth/login`, `POST /auth/login/verify` | users, login_verification_codes | auth.controller → auth.service → User, VerificationCode | SD-01 | AD-02 | `views/auth/login.view.js`, `verify.view.js` |
| RF-04 Reenviar código | CU-01, CU-02 | `POST /auth/register/resend-code`, `POST /auth/login/resend-code` | login_verification_codes | auth.controller → auth.service → VerificationCode | — | AD-01, AD-02 | `views/auth/verify.view.js` |
| RF-05 Renovar sesión | CU-03 | `POST /auth/refresh-token` | users | auth.controller → auth.service → User | — | AD-04 | `services/http.client.js` |
| RF-06 Consultar usuarios | CU-05 | `GET /users`, `GET /users/:id` | users | user.controller → user.service → User | — | AD-03 | `views/users/users.view.js` |
| RF-07 Crear usuario | CU-05 | `POST /users` | users | user.controller → user.service → User | SD-03 | AD-03 | `views/users/users.view.js` |
| RF-08 Editar usuario | CU-05 | `PUT /users/:id` | users | user.controller → user.service → User | — | AD-03 | `views/users/users.view.js` |
| RF-09 Cambiar contraseña | CU-06 | `PATCH /users/:id/password` | users | user.controller → user.service → User | — | — | `views/profile/profile.view.js`, `users.view.js` |
| RF-10 Eliminar usuario | CU-05 | `DELETE /users/:id` | users | user.controller → user.service → User | — | AD-03 | `views/users/users.view.js` |
| RF-11 Dashboard | CU-08 | `GET /metrics/dashboard` | users, endpoints, request_logs | metric.controller → metric.service → User, Endpoint, RequestLog | — | AD-04 | `views/dashboard/dashboard.view.js` |
| RF-12 Consultar endpoints | CU-09 | `GET /endpoints` | endpoints | endpoint.controller → endpoint.service → Endpoint | — | — | `views/endpoints/endpoints.view.js` |
| RF-13 Gestionar endpoints | CU-09 | `POST /endpoints`, `DELETE /endpoints/:id` | endpoints | endpoint.controller → endpoint.service → Endpoint | — | — | `views/endpoints/endpoints.view.js` |
| RF-14 Registrar peticiones | CU-11 | Todas (middleware) | request_logs | request-logger.middleware → RequestLog | SD-04 | AD-04 | — |
| RF-15 Exportar CSV | CU-10 | — | — | — (navegador) | — | AD-03, AD-04 | `utils/csv.js` |
| RF-16 Cerrar sesión | CU-04 | — | — | — (navegador) | — | — | `components/layout.component.js` |
| RF-17 Consultar perfil | CU-07 | — | — | — (datos de sesión) | — | — | `views/profile/profile.view.js` |

## RNF → componentes

| RNF | Componente |
|---|---|
| RNF-01 Cifrado bcrypt | auth.service, verification-code.service |
| RNF-02 JWT | token.service, auth.middleware |
| RNF-03 Límite de intentos | rate-limit.middleware |
| RNF-04 Códigos de un solo uso | verification-code.service, VerificationCode |
| RNF-05 Roles | auth.middleware (`authorize`) |
| RNF-06 BD externa | config/environment.js, config/database.js |
| RNF-07 Helmet y CORS | app.js |
| RNF-08 Validación con DTOs | dtos/, validate.middleware |
| RNF-09 Eliminación lógica | User.softDelete |
| RNF-10/11 Arquitectura y errores | estructura de carpetas, error.middleware, HttpError |
| RNF-12 Rendimiento | pool de conexiones, request-logger asíncrono |
| RNF-13 Usabilidad | styles.css, layout.component, toast |
| RNF-15 Pruebas | backend/tests/ |
