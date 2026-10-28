# AXON Stack Flow

Aplicación web para administrar usuarios con inicio de sesión en dos pasos (contraseña + código enviado al correo) y observar en tiempo real cómo se usa su propia API.

| Parte | Carpeta | Tecnología |
|---|---|---|
| Backend (API REST) | `backend/` | Node.js 18+, Express 4, JWT, bcrypt, Server-Sent Events |
| Frontend (interfaz web) | `frontend/` | HTML, CSS y JavaScript (módulos ES), servido por el mismo backend |
| Base de datos | Externa | Se consulta por medio de su API. No hay código de base de datos en el proyecto |

## Funcionalidades

- Registro con verificación del correo e inicio de sesión en dos pasos (código de 6 dígitos).
- Recuperación de contraseña con código al correo ("¿Olvidaste tu contraseña?").
- Sesión con token de 15 minutos que se renueva sola. Al restablecer o cambiar la contraseña se cierran las demás sesiones.
- Gestión de usuarios por roles (administrador y usuario), con paginación, confirmaciones y eliminación lógica.
- Panel de control (solo administradores): cinco indicadores, arquitectura visual, gráficas, estado de los servicios y actividad reciente.
- Simulación de una petición que recorre las cuatro capas: Cliente, API, Backend y Base de datos.
- Actividad en vivo (solo administradores): cada petición a la API aparece al instante, con medición de latencia e historial filtrable.
- Monitoreo de endpoints: peticiones, errores, latencia y estado (saludable, con errores o sin tráfico) de cada ruta vigilada.
- Ver detalle: al seleccionar un usuario, un endpoint monitoreado o una petición registrada se abre un panel lateral con sus datos.
- Exportación a CSV, tema claro y oscuro, y diseño adaptable a celular.

## Arquitectura

El proyecto sigue el patrón **Modelo – Vista – Controlador** en el backend y en el frontend. Las capas se comunican, pero cada una hace solo su parte. El frontend nunca se conecta a la base de datos: todo lo pide al backend, y el backend pide los datos a la API de la base de datos externa.

```
FRONTEND                                         BACKEND                                                BASE DE DATOS

vista ─► controlador ─► modelo (api.js) ── req ──► ruta ─► middlewares ─► vista de petición ─► controlador ─► servicio ─► modelo ──► API externa
  ▲                         │                                                                       │
  └──── datos ◄─────────────┴──────────── res ◄──────────── vista de respuesta ◄────────────────────┘
```

Un solo servidor atiende las dos partes: `/api/...` es la API y cualquier otra dirección entrega el frontend. Por eso no hace falta CORS ni configurar la URL de la API en el frontend.

La base de datos **no forma parte del proyecto**: aquí no hay SQL (`SELECT`, `DELETE`...), tablas, conexión directa ni usuarios escritos en el código. Los modelos del backend piden y guardan los datos llamando a la API de la base de datos externa (GET, POST, PATCH, DELETE) desde `externos.js`, con la dirección y la clave definidas en `backend/.env`, archivo que no se sube al repositorio. El respaldo de la base de datos es responsabilidad de ese servicio externo.

## Estructura de carpetas

```
axon-stack-flow/
├── backend/
│   ├── modelos/            usuario, codigo-verificacion, endpoint-monitoreado, registro-peticion, base-datos
│   ├── vistas/             comunes, autenticacion, usuarios, monitoreo, metricas, simulacion, eventos
│   ├── controladores/      index (une los módulos) + autenticacion, usuarios, monitoreo, metricas, simulacion, eventos (cada uno declara sus endpoints)
│   ├── servicios/          autenticacion, usuarios, monitoreo, metricas, simulacion, eventos
│   ├── middlewares/        autenticacion, validacion, registro-peticiones, errores
│   ├── pruebas/            unitarias.test.js, api.test.js, carga.js
│   ├── configuracion.js    Variables de entorno, constantes (roles, seguridad), errores y validaciones
│   ├── externos.js         API de la base de datos externa, correo y tokens JWT
│   ├── servidor.js         Express (API + frontend), seguridad (Helmet/CSP) y arranque
│   ├── crear-admin.js      Crea el primer administrador
│   └── .env.example
│
├── frontend/
│   ├── css/                estilos.css (tokens de diseño, componentes y pantallas)
│   ├── img/                favicon.svg
│   ├── js/
│   │   ├── modelos/        sesion (sesión y tema), api (solo el cliente HTTP), eventos (tiempo real)
│   │   ├── vistas/         inicio-sesion, registro, verificacion, recuperar-contrasena, panel, usuarios, monitoreo, actividad, perfil
│   │   │                   + dto (DTO de petición) + componentes (menú, tablas, tarjetas, modal, panel lateral de detalle, gráficas, arquitectura...)
│   │   ├── controladores/  los mismos nombres que vistas/ + menu; cada uno declara los endpoints que usa
│   │   ├── principal.js    Pantallas (#/...), permisos por rol y navegación
│   │   └── utilidades.js   Elementos HTML, íconos, notificaciones, formatos, CSV y almacenamiento
│   └── index.html
│
├── package.json
└── README.md
```

### Backend

| Capa | Carpeta | Responsabilidad |
|---|---|---|
| **Modelo** | `modelos/` | Una clase por entidad; única capa que pide y guarda datos (en la API externa) |
| **Vista** | `vistas/` | Los DTO de cada recurso en un solo archivo. **Petición (req):** reúne body, `:id` y `?query`, los limpia y los valida. **Respuesta (res):** define el JSON que sale; nunca se envía un modelo directo ni el hash de la contraseña |
| **Controlador** | `controladores/` | Declara sus endpoints (Router: método, URL, acceso, DTO de petición y función), recibe la petición ya validada (`req.dto`), llama al servicio y responde con la vista. `controladores/index.js` los une |
| Servicios | `servicios/` | Reglas de negocio. Devuelven datos del dominio, no respuestas HTTP |
| Middlewares | `middlewares/` | Token y roles, límite de intentos, validación, registro de peticiones y errores |

### Frontend

| Capa | Carpeta | Responsabilidad |
|---|---|---|
| **Modelo** | `js/modelos/` | Estado del cliente (sesión y tema), el cliente HTTP (`api.js`) y la conexión en tiempo real |
| **Vista** | `js/vistas/` | Una por pantalla. Solo dibuja los datos que recibe y avisa de los eventos (`onSave`, `onDelete`…). No llama a la API ni navega |
| **Controlador** | `js/controladores/` | Uno por pantalla. Declara sus endpoints, arma el DTO de petición (`vistas/dto.js`) con los datos de la vista, se los pasa a la vista, atiende sus eventos, muestra los mensajes y las confirmaciones y decide la navegación |

Cada recurso tiene el mismo nombre en todas las capas. Por ejemplo, **usuarios**:

| Capa | Archivo |
|---|---|
| Vista (frontend) | `frontend/js/vistas/usuarios.js` |
| Controlador (frontend) | `frontend/js/controladores/usuarios.js` |
| DTO de petición (frontend) | `frontend/js/vistas/dto.js` |
| Vista (DTO de petición y respuesta) | `backend/vistas/usuarios.js` |
| Controlador (backend) | `backend/controladores/usuarios.js` |
| Servicio | `backend/servicios/usuarios.js` |
| Modelo | `backend/modelos/usuario.js` |

Los nombres de carpetas y archivos están en español; el código interno (variables, funciones, clases y endpoints) está en inglés.

## Endpoints

Todas las rutas empiezan por `/api`. **Sesión** indica que la ruta exige el token de acceso (`Authorization: Bearer <token>`); **Admin**, que además exige rol de administrador. Las vistas están en `backend/vistas/` con el nombre del recurso, y los endpoints del frontend están al inicio de cada archivo de `frontend/js/controladores/`. `LoginRequestDto` se conserva como alias de `CredentialsRequestDto`.

| Método | Ruta | Acceso | Vista de petición (req) | Vista de respuesta (res) | Llamado en el frontend |
|---|---|---|---|---|---|
| GET | `/health` | Público | — | `HealthResponseDto` | `getHealth` |
| POST | `/auth/register` | Público | `RegisterRequestDto` | `VerificationRequiredResponseDto` | `register` |
| POST | `/auth/register/verify` | Público | `VerifyCodeRequestDto` | `EmailVerifiedResponseDto` | `verifyRegistration` |
| POST | `/auth/register/resend-code` | Público | `ResendCodeRequestDto` | `MessageResponseDto` | `resendRegistrationCode` |
| POST | `/auth/login` | Público | `CredentialsRequestDto` | `VerificationRequiredResponseDto` | `login` |
| POST | `/auth/login/verify` | Público | `VerifyCodeRequestDto` | `SessionResponseDto` | `verifyLogin` |
| POST | `/auth/login/resend-code` | Público | `ResendCodeRequestDto` | `MessageResponseDto` | `resendLoginCode` |
| POST | `/auth/password/forgot` | Público (límite de 5 cada 15 min) | `ForgotPasswordRequestDto` | `MessageResponseDto` | `forgotPassword` |
| POST | `/auth/password/reset` | Público | `ResetPasswordRequestDto` | `MessageResponseDto` | `resetPassword` |
| POST | `/auth/refresh-token` | Público | `RefreshTokenRequestDto` | `SessionResponseDto` | `refreshSession` (automático) |
| GET | `/users?page=&limit=` | Admin | `ListUsersRequestDto` | `UserListResponseDto` | `listUsers`, `listAllUsers` |
| GET | `/users/:id` | Sesión (propio o admin) | `UserIdRequestDto` | `UserResponseDto` | `getUser` |
| POST | `/users` | Admin | `CreateUserRequestDto` | `UserResponseDto` | `createUser` |
| PUT | `/users/:id` | Admin | `UpdateUserRequestDto` | `UserResponseDto` | `updateUser` |
| PATCH | `/users/:id/password` | Sesión (propio o admin) | `ChangePasswordRequestDto` | `SessionResponseDto` (contraseña propia) o `MessageResponseDto` (la de otro usuario) | `changePassword` |
| DELETE | `/users/:id` | Admin | `UserIdRequestDto` | `MessageResponseDto` | `removeUser` |
| GET | `/monitoring/routes` | Admin | — | `ApiRouteListResponseDto` | `listApiRoutes` |
| GET | `/monitoring/endpoints` | Sesión | — | `MonitoredEndpointListResponseDto` | `listEndpoints` |
| GET | `/monitoring/endpoints/:id` | Sesión | `MonitoredEndpointIdRequestDto` | `MonitoredEndpointDetailResponseDto` | `getEndpoint` |
| POST | `/monitoring/endpoints` | Admin | `CreateMonitoredEndpointRequestDto` | `MonitoredEndpointResponseDto` | `addEndpoint` |
| DELETE | `/monitoring/endpoints/:id` | Admin | `MonitoredEndpointIdRequestDto` | `MessageResponseDto` | `removeEndpoint` |
| GET | `/metrics/dashboard` | Admin | — | `DashboardResponseDto` | `getDashboard` |
| GET | `/metrics/requests?page=&limit=&method=&statusClass=` | Admin | `ListRequestLogsRequestDto` | `RequestLogListResponseDto` | `listRequests` |
| GET | `/metrics/requests/:id` | Admin | `RequestLogIdRequestDto` | `RequestLogDetailResponseDto` | `getRequest` |
| GET | `/metrics/services` | Admin | — | `ServiceListResponseDto` | `getServices` |
| POST | `/simulations` (alias `/axonApi`) | Admin | `RunSimulationRequestDto` | `SimulationResponseDto` | `runSimulation` |
| GET | `/events/stream?token=` | Admin | `StreamRequestDto` | Eventos SSE (ver abajo) | `stream.connect` en `js/modelos/eventos.js` |
| POST | `/events/ping` | Admin | — | `PongResponseDto` | `pingEvents` |

Cualquier error responde con `ErrorResponseDto`: `{ "ok": false, "message": "...", "errors": [...], "code": "..." }`. Una ruta que no existe responde 404 con `{ "message": "Endpoint no encontrado", "path", "method" }`.

**Tiempo real (Server-Sent Events).** `GET /api/events/stream` mantiene la conexión abierta y envía estos eventos:

| Evento | Cuándo | Datos |
|---|---|---|
| `stream:connected` | Al conectarse | Cliente y hora |
| `stream:heartbeat` | Cada 15 segundos | Clientes conectados y tiempo activo |
| `api:activity` | Cada petición a la API | `id` del registro, método, ruta, estado, latencia y hora |

**Ping y pong.** `stream:ping` es la petición `POST /api/events/ping` que envía el cliente; `stream:pong` es su respuesta (`PongResponseDto`, con la hora) y no un evento SSE. El cliente la usa para medir el tiempo de ida y vuelta.

El navegador no permite enviar encabezados con `EventSource`, por eso el token va en `?token=`. Las rutas se guardan sin la query, así que el token nunca queda registrado.

**Reglas de negocio**

- Para cambiar la contraseña propia hay que enviar la actual (`currentPassword`). El administrador puede cambiar la de otros sin ella.
- Nadie puede eliminarse a sí mismo ni cambiar su propio rol, y siempre debe quedar al menos un administrador activo.
- Solo se pueden monitorear rutas que existen en la API, y cada una una sola vez. Un endpoint está "con errores" si el 20 % o más de sus respuestas fallan.
- En cada petición se comprueba que el usuario del token siga activo: una cuenta eliminada pierde el acceso de inmediato.
- El reenvío de código responde lo mismo exista o no el correo, para no revelar qué cuentas existen.
- La recuperación de contraseña responde lo mismo exista o no el correo (y esté activo y verificado o no).
- Al restablecer o cambiar una contraseña se cierran las demás sesiones (ver "Sesiones y `token_version`").

## Secuencia del inicio de sesión

El login sigue el diagrama de secuencia del tablero. Cada participante tiene su equivalente en el código:

| Participante del diagrama | En AXON |
|---|---|
| Usuario | La persona en el navegador |
| Vista | `frontend/js/vistas/inicio-sesion.js` (`onSubmit({ email, password })`). Su controlador, `controladores/inicio-sesion.js`, llama a `login(new CredentialsRequestDto({ email, password }))` |
| DTO de entrada (usu, contra) | `CredentialsRequestDto` en `backend/vistas/autenticacion.js` |
| Controlador | `login` en `backend/controladores/autenticacion.js` |
| `validateCredentials(usu, contra)` | `authService.validateCredentials({ email, password })`, que llama a `User.validateCredentials(email, password)` |
| Modelo | `backend/modelos/usuario.js`: convierte la fila de la base en un `User` |
| Base de datos | API externa: `GET /users?email=&includeInactive=true&limit=1` |
| DTO de salida | `UserDto`, dentro de `SessionResponseDto.user` |

Pasos:

1. El usuario escribe correo y contraseña en la Vista, que los entrega a su controlador.
2. `POST /api/auth/login`: la ruta valida el body con `CredentialsRequestDto` (correo válido y contraseña no vacía).
3. El controlador llama a `validateCredentials`. El servicio pide al Modelo `User.validateCredentials`, que busca el correo en la API externa y compara la contraseña con bcrypt.
4. **Credenciales válidas:** el Modelo devuelve el `User`. El servicio comprueba que la cuenta esté activa y verificada, y `startLoginVerification` genera el código de 6 dígitos y lo envía al correo. La respuesta es `VerificationRequiredResponseDto` y la Vista pasa a `#/verify`.
5. El usuario escribe el código (`POST /api/auth/login/verify`). Si es correcto, el backend responde con `SessionResponseDto` (`accessToken`, `refreshToken` y `user` como `UserDto`) y se muestra el panel: `#/dashboard` para el administrador y `#/monitoring` para el usuario común.
6. **Credenciales inválidas** (el correo no existe o la contraseña no coincide, el "( )" vacío del diagrama): el Modelo devuelve `null`, el servicio responde 401 "Credenciales incorrectas" con `ErrorResponseDto` y la Vista muestra el error junto al enlace "¿Olvidaste tu contraseña?". Una cuenta desactivada responde 403, y una sin verificar, 403 con el código `EMAIL_NOT_VERIFIED`.

El hash de la contraseña nunca sale del backend: la Vista solo recibe un `UserDto`.

## Recuperar contraseña

Entrada: el enlace "¿Olvidaste tu contraseña?" del inicio de sesión (`#/forgot-password`, pantalla pública con dos pasos).

1. **Solicitar el código.** El usuario escribe su correo y el frontend llama a `forgotPassword` (`POST /api/auth/password/forgot`, `ForgotPasswordRequestDto`). Si la cuenta existe, está activa y verificada, se invalidan los códigos anteriores y se envía un código de 6 dígitos con `purpose: "password_reset"` (asunto "AXON Security · Código para restablecer tu contraseña").
2. **Restablecer.** En el mismo formulario escribe el código, la contraseña nueva y su confirmación (que se comprueba en el navegador). El frontend llama a `resetPassword` (`POST /api/auth/password/reset`, `ResetPasswordRequestDto`: `email`, `code` de 6 dígitos y `password`).
3. El backend comprueba el código (vence en 5 minutos, 5 intentos y uso único), guarda la contraseña con bcrypt, incrementa `token_version`, invalida los códigos de inicio de sesión pendientes y responde "Contraseña actualizada. Ya puedes iniciar sesión.". El frontend vuelve a `#/login`.
4. El pie de la pantalla permite reenviar el código (con una espera de 30 segundos) y volver al inicio de sesión.

**Respuesta genérica.** `forgot` siempre responde 200 con el mismo mensaje ("Si el correo está registrado, te enviamos un código para restablecer tu contraseña"), exista o no el correo, para no revelar qué cuentas existen. Un código incorrecto o vencido en `reset` responde 401 "Código inválido o expirado".

**Límite.** `forgot` admite como máximo 5 solicitudes por IP cada 15 minutos, cuenten o no como éxito; la sexta responde 429. `reset` usa el límite de intentos fallidos de autenticación (5 cada 15 minutos).

## Ver detalle

Desde el panel de cada rol se puede seleccionar una fila (con clic, o con Enter o Espacio) y se abre un panel lateral con el detalle. Cerrar vuelve a la pantalla anterior.

| Pantalla | Quién | Qué se selecciona | Qué muestra | Endpoint |
|---|---|---|---|---|
| `#/monitoring` | Todos | Un endpoint monitoreado | Datos, estado, estadísticas (peticiones, errores, tasa de error, latencia, última petición) y sus últimas 10 peticiones. El administrador puede abrir cada una de esas peticiones y quitar el endpoint del monitoreo | `GET /api/monitoring/endpoints/:id` |
| `#/dashboard` ("Actividad reciente") y `#/activity` (historial y filas en vivo) | Administrador | Una petición registrada | Método, ruta, patrón, estado, latencia, origen, fecha y el usuario que la hizo (nombre y correo, o ninguno si fue anónima) | `GET /api/metrics/requests/:id` |
| `#/users` | Administrador | Un usuario | Datos, rol, correo verificado, fecha de creación y de actualización, con las acciones Editar y Eliminar | `GET /api/users/:id` |

Las filas en vivo de `#/activity` se pueden abrir porque `api:activity` trae el `id` del registro.

## Sesiones y `token_version`

Cada usuario tiene un número de versión de sesión, `token_version` (entero, 0 por defecto), guardado en el recurso `/users` de la API externa. El modelo `User` lo lee como `tokenVersion`.

- Los dos tokens (acceso y renovación) llevan `ver`, la versión del usuario al emitirse.
- En cada petición y en cada renovación se compara `ver` con la versión actual. Si no coincide, responde 401 "La sesión ya no es válida".
- Restablecer la contraseña (`/auth/password/reset`) y cambiarla (`PATCH /users/:id/password`, propia o hecha por el administrador) suman 1 a `token_version`, así que se cierran las demás sesiones, incluidos los tokens de renovación robados.
- Quien cambia **su propia** contraseña recibe un `SessionResponseDto` con tokens nuevos y el frontend los guarda, así que sigue conectado en ese dispositivo. Si el administrador cambia la de otro usuario, la respuesta es solo un `MessageResponseDto`.

## Equivalencias con el documento de requerimientos

`POST /auth/verify-code` del documento corresponde a `POST /auth/register/verify` y `POST /auth/login/verify`; `/auth/verify-registration`, a `/auth/register/verify`; `/auth/resend-registration`, a `/auth/register/resend-code`; y `/auth/resend-code`, a `/auth/login/resend-code`. La recuperación de contraseña (`/auth/password/forgot` y `/auth/password/reset`) y el detalle (`/monitoring/endpoints/:id` y `/metrics/requests/:id`) son ampliaciones del tablero. `POST /api/axonApi` se mantiene como alias de `POST /api/simulations`. Socket.IO se reemplazó por Server-Sent Events, que no necesita dependencias adicionales.

Se usa un único servidor (puerto 4000) en lugar de dos (5173 y 4000). Los DTO de los diagramas (`UsuarioDTO.cs`) equivalen a los de `backend/vistas/autenticacion.js`, y `validarCredenciales` a `validateCredentials`.

## API de la base de datos externa

Los modelos usan los siguientes recursos de la API externa. Cada petición envía la clave en el encabezado `x-api-key`, y los datos viajan en JSON con los nombres de columna de la base (`password_hash`, `email_verified`, `created_at`...). Las columnas dependen del recurso:

| Recurso | Columnas |
|---|---|
| `/users` | `id`, `name`, `email`, `password_hash`, `role`, `email_verified`, `created_by_id`, `token_version`, `created_date`, `updated_date` |
| `/verification-codes` | `id`, `user_id`, `email`, `purpose`, `code_hash`, `expires_at`, `attempts`, `used`, `created_at` |
| `/endpoints` | `id`, `name`, `method`, `path`, `description`, `created_at` |
| `/request-logs` | `id`, `method`, `path`, `route`, `status_code`, `latency_ms`, `source`, `user_id`, `created_at` |

`token_version` es una columna entera nueva de `/users` (0 por defecto). `purpose` de `/verification-codes` admite `login`, `registration` y `password_reset`.

| Modelo | Método | Ruta | Uso |
|---|---|---|---|
| `base-datos.js` | GET | `/health` | Comprobar que la API responde (y medir su latencia) |
| `usuario.js` | GET | `/users?page=&limit=` | Usuarios activos paginados → `{ data, total }` |
| | GET | `/users?email=&includeInactive=true&limit=1` | Buscar por correo (incluye inactivos) |
| | GET | `/users/:id` | Un usuario (404 si no existe) |
| | GET | `/users/count-by-role` | `{ admin, user, inactive }` |
| | POST | `/users` | Crear usuario |
| | PATCH | `/users/:id` | Editar datos, contraseña (junto con `token_version`), verificación o rol |
| `codigo-verificacion.js` | POST | `/verification-codes` | Guardar un código (hash) |
| | GET | `/verification-codes/active?email=&purpose=` | Último código vigente (404 si no hay) |
| | POST | `/verification-codes/:id/attempts` | Sumar un intento |
| | PATCH | `/verification-codes/:id` | Marcar como usado |
| | POST | `/verification-codes/invalidate` | Invalidar los códigos anteriores (`email` y `purpose`) |
| `endpoint-monitoreado.js` | GET | `/endpoints`, `/endpoints/:id` | Endpoints monitoreados → `{ data }` |
| | POST / DELETE | `/endpoints`, `/endpoints/:id` | Agregar y quitar |
| `registro-peticion.js` | POST | `/request-logs` | Registrar una petición (`method`, `path`, `route`, `status_code`, `latency_ms`, `source`, `user_id`) → responde `{ id }` |
| | GET | `/request-logs?page=&limit=&method=&statusClass=&route=` | Historial del más nuevo al más viejo → `{ data, total }`. `statusClass` es `2xx`, `3xx`, `4xx` o `5xx`; `route` filtra por la ruta exacta (patrón) |
| | GET | `/request-logs/:id` | Un registro (404 si no existe) |
| | GET | `/request-logs/summary` | `{ total, last24h, avgLatencyMs, byStatus, byMethod }` (promedio sobre todos los registros) |
| | GET | `/request-logs/stats-by-route` | `{ data: [{ method, route, total, errors, avgLatencyMs, lastRequestAt }] }`, donde `errors` cuenta respuestas con código 400 o superior |

`path` se guarda sin la query y `route` es la ruta en forma de patrón (`/api/users/15` se guarda como `/api/users/:id`), para agrupar las estadísticas por endpoint.

Si la API externa no responde, el backend devuelve 503; si responde con error, 502.

## Instalación

**Requisitos:** Node.js 18 o superior, y la dirección y la clave de la API de la base de datos externa.

Todos los comandos se ejecutan desde la carpeta raíz del proyecto.

**1. Instalar dependencias**

```bash
npm install
```

**2. Configurar la conexión.** Copia el archivo de ejemplo y complétalo:

```bash
cp backend/.env.example backend/.env       # Windows: copy backend\.env.example backend\.env
```

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (por defecto 4000) |
| `TRUST_PROXY` | `false` (por defecto) o el número de proxies de confianza delante del servidor |
| `DATABASE_API_URL` | Dirección de la API de la base de datos externa |
| `DATABASE_API_KEY` | Clave de acceso a esa API |
| `DATABASE_API_TIMEOUT_MS` | Tiempo máximo de espera por petición (por defecto 5000) |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Textos secretos de al menos 16 caracteres |
| `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` | Duración de los tokens (por defecto 15m y 7d) |
| `SMTP_*` | Opcional. Sin SMTP, los códigos de verificación se muestran en la consola del servidor |

**3. Crear el primer administrador** (una sola vez; se guarda en la base de datos externa)

```bash
npm run crear-admin -- "Nombre Apellido" admin@correo.com "Contrasena1"
```

**4. Iniciar**

```bash
npm start
```

Abre http://localhost:4000 e inicia sesión con el administrador creado. La API queda en http://localhost:4000/api.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm start` | Inicia la aplicación (API y frontend) |
| `npm run dev` | Igual, y se reinicia al guardar cambios |
| `npm run crear-admin -- "Nombre" correo "Clave"` | Crea un usuario administrador |
| `npm test` | Todas las pruebas (unitarias e integración) |
| `npm run pruebas:unitarias` | Solo pruebas unitarias (no necesitan base de datos) |
| `npm run pruebas:integracion` | Solo pruebas de la API (necesitan `backend/.env` y la API de la base de datos disponible) |
| `npm run pruebas:carga` | 200 peticiones a `/api/health` con 20 a la vez; muestra el promedio y el percentil 95 (con el servidor encendido) |

Para revisar las dependencias: `npm outdated` (versiones nuevas) y `npm audit` (vulnerabilidades conocidas).

## Seguridad

- Contraseñas y códigos guardados con bcrypt.
- Tokens JWT: acceso de 15 minutos (se renueva solo) y renovación de 7 días.
- Códigos de 6 dígitos que vencen en 5 minutos y permiten 5 intentos.
- Máximo 5 intentos fallidos de inicio de sesión cada 15 minutos, por IP y por correo. Pedir o reenviar un código: máximo 5 cada 15 minutos y una espera de 30 segundos entre envíos.
- Contraseñas de 8 a 72 caracteres; todos los datos de entrada se validan por tipo y largo máximo.
- La IP real del cliente solo se toma de `X-Forwarded-For` si hay un proxy de confianza (`TRUST_PROXY`, por defecto desactivado).
- Tiempo real: máximo 3 conexiones por usuario; en cada latido se revalida la sesión y se cierra si dejó de ser válida.
- Las exportaciones CSV neutralizan las fórmulas de Excel.
- Máximo 5 solicitudes de código de recuperación por IP cada 15 minutos.
- Las sesiones se cierran al cambiar la contraseña (`token_version`).
- Validación de todos los datos de entrada antes de enviarlos a la base de datos.
- El proyecto no tiene acceso directo a la base: solo usa su API, con una clave y un tiempo máximo de espera.
- Cabeceras de seguridad con Helmet y una política de contenido (CSP) que solo permite scripts propios (Chart.js se sirve desde el mismo servidor en `/vendor`) y las fuentes de Google.
- Mismo origen para la API y la interfaz, así que no se abre CORS.
- Credenciales solo en `backend/.env`, excluido del repositorio.
