# AXON Stack Flow

Aplicación web para administrar usuarios con inicio de sesión en dos pasos (contraseña + código enviado al correo) y observar en tiempo real cómo se usa su propia API.

| Parte | Carpeta | Tecnología |
|---|---|---|
| Backend (API REST) | `BACKEND/` | Node.js 18+, Express 4, JWT, bcrypt, Server-Sent Events |
| Frontend (interfaz web) | `FRONTEND/` | HTML, CSS y JavaScript (módulos ES), servido por el mismo backend |
| Base de datos | Externa (19 tablas) | Se consulta por medio de su API. No hay código de base de datos en el proyecto |

## Funcionalidades

- Registro con verificación del correo e inicio de sesión en dos pasos (código de 6 dígitos).
- Sesión con token de 15 minutos que se renueva sola. Al cambiar la contraseña se cierran las demás sesiones.
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

Un solo servidor atiende las dos partes: `/api/...` es la API y `/vistas/...` son las páginas del frontend. Por eso no hace falta CORS ni configurar la URL de la API en el frontend.

La base de datos **no forma parte del proyecto**: aquí no hay SQL (`SELECT`, `DELETE`...), conexión directa ni usuarios escritos en el código. Solo se conocen los 19 recursos de su API (ver "API de la base de datos externa"). Los modelos del backend piden y guardan los datos llamando a la API de la base de datos externa (GET, POST, PATCH, DELETE) desde `config/base-datos.js`, con la dirección y la clave definidas en `BACKEND/.env`, archivo que no se sube al repositorio. El respaldo de la base de datos es responsabilidad de ese servicio externo.

## Estructura de carpetas

La organización sigue la misma de nuestro proyecto de referencia (Glamping): `BACKEND/` con `main`, `config`, `controladores`, `rutas`, `modelos` (uno por tabla) y `esquemas` (DTO), y `FRONTEND/` con `css`, `js` y `vistas` (una página por pantalla).

```
AXON_Stack_Flow/
├── BACKEND/
│   ├── main.js             Arranca el servidor y registra todos los controladores (API + FRONTEND)
│   ├── config/             configuracion (variables y constantes), base-datos (API externa y catálogos),
│   │                       seguridad (tokens JWT), correo, autenticacion (sesión, roles y límite de intentos),
│   │                       validacion, errores, registro_peticiones
│   ├── controladores/      <modulo>_controlador.js: los endpoints de cada módulo (prefijo + router)
│   │                       autenticacion, usuarios, monitoreo, metricas, simulacion, eventos
│   ├── rutas/              La lógica de negocio que usan los endpoints (mismos nombres) + datos_iniciales (primer admin)
│   ├── modelos/            <tabla>_modelo.js: un archivo por tabla (19) + index.js que los registra todos
│   ├── esquemas/           DTOs_Comunes, DTOs_Usuarios_Autenticacion, DTOs_Monitoreo_Metricas, DTOs_Simulacion_Eventos
│   │                       (DTO de petición, de respuesta y las funciones que reciben req)
│   ├── pruebas/            unitarias/, api.test.js, carga.js
│   ├── LEEME.md            Cómo correr el backend
│   ├── package.json
│   └── .env.example
│
├── FRONTEND/
│   ├── css/                estilos.css
│   ├── img/                favicon.svg
│   ├── js/
│   │   ├── app.js          La cargan todas las páginas: revisa la sesión y el rol y dibuja la pantalla
│   │   ├── modelos/        sesion (sesión y tema), api (cliente HTTP), eventos (tiempo real)
│   │   ├── dto/            DTO de petición: comunes, autenticacion, usuarios, monitoreo, metricas, simulacion, eventos
│   │   ├── vistas/         Lo que dibuja cada pantalla + componentes (menú, tablas, tarjetas, gráficas...)
│   │   ├── controladores/  Uno por pantalla + menu; cada uno declara los endpoints que usa
│   │   └── utilidades.js
│   └── vistas/             Una página por pantalla: inicio-sesion, registro, verificacion, panel,
│                           usuarios, monitoreo, actividad, perfil (.html)
│
└── README.md
```

### Backend

| Carpeta | Qué tiene |
|---|---|
| `main.js` | Crea la aplicación, la seguridad (Helmet/CSP), registra los controladores y sirve el FRONTEND |
| `config/` | Todo lo que configura el sistema: variables de entorno, conexión a la API de la base, tokens, correo y los filtros que pasan las peticiones (sesión, roles, validación, errores, registro) |
| `controladores/` | Solo los endpoints: una línea por ruta, `router.<método>(ruta, filtros, validateRequest(XRequestDto), función)` |
| `rutas/` | La lógica de negocio. Devuelve datos, no respuestas HTTP |
| `modelos/` | Un archivo por tabla. Es la única capa que lee y guarda datos (en la API externa) |
| `esquemas/` | Los DTO: los de petición limpian y validan lo que llega; los de respuesta definen el JSON que sale (nunca el hash de la contraseña); y las funciones de cada endpoint, que reciben `req`, llaman a `rutas/` y responden con un DTO |

### Frontend

| Carpeta | Qué tiene |
|---|---|
| `vistas/*.html` | Una página por pantalla. Cada una carga `css/estilos.css` y `js/app.js` |
| `js/app.js` | Revisa si hay sesión y el rol; si la página no le corresponde, lleva a la correcta |
| `js/modelos/` | Sesión y tema, el cliente HTTP (`api.js`) y la conexión en tiempo real |
| `js/vistas/` | Dibuja los datos que recibe y avisa de los eventos (`onSave`, `onDelete`…). No llama a la API |
| `js/controladores/` | Declara sus endpoints, arma el DTO de petición (`js/dto/`), atiende los eventos de la vista y navega |

Cada recurso tiene el mismo nombre en todas las capas. Por ejemplo, **usuarios**:

| Capa | Archivo |
|---|---|
| Página | `FRONTEND/vistas/usuarios.html` |
| Vista (frontend) | `FRONTEND/js/vistas/usuarios.js` |
| Controlador (frontend) | `FRONTEND/js/controladores/usuarios.js` |
| DTO de petición (frontend) | `FRONTEND/js/dto/usuarios.js` |
| Endpoints (backend) | `BACKEND/controladores/usuarios_controlador.js` (solo la lista) |
| DTO y funciones de los endpoints | `BACKEND/esquemas/DTOs_Usuarios_Autenticacion.js` |
| Lógica | `BACKEND/rutas/usuarios.js` |
| Modelo | `BACKEND/modelos/usuarios_modelo.js` |

Los nombres de carpetas y archivos están en español; el código interno (variables, funciones, clases y endpoints) está en inglés.

## Endpoints

Todas las rutas empiezan por `/api`. **Sesión** indica que la ruta exige el token de acceso (`Authorization: Bearer <token>`); **Admin**, que además exige rol de administrador. Los endpoints están en `BACKEND/controladores/<modulo>_controlador.js`; los DTO y las funciones de cada endpoint, en `BACKEND/esquemas/DTOs_*.js`, y los endpoints del frontend están al inicio de cada archivo de `FRONTEND/js/controladores/`.

| Método | Ruta | Acceso | DTO de petición (req) | DTO de respuesta (res) | Llamado en el frontend |
|---|---|---|---|---|---|
| GET | `/health` | Público | — | `HealthResponseDto` | `getHealth` |
| POST | `/auth/register` | Público | `RegisterRequestDto` | `VerificationRequiredResponseDto` | `register` |
| POST | `/auth/register/verify` | Público | `VerifyCodeRequestDto` | `EmailVerifiedResponseDto` | `verifyRegistration` |
| POST | `/auth/register/resend-code` | Público | `ResendCodeRequestDto` | `MessageResponseDto` | `resendRegistrationCode` |
| POST | `/auth/login` | Público | `CredentialsRequestDto` | `VerificationRequiredResponseDto` | `login` |
| POST | `/auth/login/verify` | Público | `VerifyCodeRequestDto` | `SessionResponseDto` | `verifyLogin` |
| POST | `/auth/login/resend-code` | Público | `ResendCodeRequestDto` | `MessageResponseDto` | `resendLoginCode` |
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
- Al cambiar una contraseña se cierran las demás sesiones (ver "Sesiones y `token_version`").

## Secuencia del inicio de sesión

El login sigue el diagrama de secuencia del tablero. Cada participante tiene su equivalente en el código:

| Participante del diagrama | En AXON |
|---|---|
| Usuario | La persona en el navegador |
| Vista | `FRONTEND/js/vistas/inicio-sesion.js` (`onSubmit({ email, password })`). Su controlador, `controladores/inicio-sesion.js`, llama a `login(new CredentialsRequestDto({ email, password }))` |
| DTO de entrada (usu, contra) | `CredentialsRequestDto` en `BACKEND/esquemas/DTOs_Usuarios_Autenticacion.js` |
| Endpoint | `POST /api/auth/login` en `BACKEND/controladores/autenticacion_controlador.js`; la función `login` está en `BACKEND/esquemas/DTOs_Usuarios_Autenticacion.js` |
| `validateCredentials(usu, contra)` | `authService.validateCredentials({ email, password })`, que llama a `User.validateCredentials(email, password)` |
| Modelo | `BACKEND/modelos/usuarios_modelo.js`: convierte la fila de la base en un `User` |
| Base de datos | API externa: `GET /users?email=&includeInactive=true&limit=1` |
| DTO de salida | `UserDto`, dentro de `SessionResponseDto.user` |

Pasos:

1. El usuario escribe correo y contraseña en la Vista, que los entrega a su controlador.
2. `POST /api/auth/login`: la ruta valida el body con `CredentialsRequestDto` (correo válido y contraseña no vacía).
3. El controlador llama a `validateCredentials`. El servicio pide al Modelo `User.validateCredentials`, que busca el correo en la API externa y compara la contraseña con bcrypt.
4. **Credenciales válidas:** el Modelo devuelve el `User`. El servicio comprueba que la cuenta esté activa y verificada, y `startLoginVerification` genera el código de 6 dígitos y lo envía al correo. La respuesta es `VerificationRequiredResponseDto` y la Vista pasa a `#/verify`.
5. El usuario escribe el código (`POST /api/auth/login/verify`). Si es correcto, el backend responde con `SessionResponseDto` (`accessToken`, `refreshToken` y `user` como `UserDto`) y se muestra el panel: `panel.html` para el administrador y `monitoreo.html` para el usuario común.
6. **Credenciales inválidas** (el correo no existe o la contraseña no coincide, el "( )" vacío del diagrama): el Modelo devuelve `null`, el servicio responde 401 "Credenciales incorrectas" con `ErrorResponseDto` y la Vista muestra el error. Una cuenta desactivada responde 403, y una sin verificar, 403 con el código `EMAIL_NOT_VERIFIED`.

El hash de la contraseña nunca sale del backend: la Vista solo recibe un `UserDto`.

## Ver detalle

Desde el panel de cada rol se puede seleccionar una fila (con clic, o con Enter o Espacio) y se abre un panel lateral con el detalle. Cerrar vuelve a la pantalla anterior.

| Pantalla | Quién | Qué se selecciona | Qué muestra | Endpoint |
|---|---|---|---|---|
| `#/monitoring` | Todos | Un endpoint monitoreado | Datos, estado, estadísticas (peticiones, errores, tasa de error, latencia, última petición) y sus últimas 10 peticiones. El administrador puede abrir cada una de esas peticiones y quitar el endpoint del monitoreo | `GET /api/monitoring/endpoints/:id` |
| `#/dashboard` ("Actividad reciente") y `#/activity` (historial y filas en vivo) | Administrador | Una petición registrada | Método, ruta, patrón, estado, latencia, origen, fecha y el usuario que la hizo (nombre y correo, o ninguno si fue anónima) | `GET /api/metrics/requests/:id` |
| `#/users` | Administrador | Un usuario | Datos, rol, correo verificado, fecha de creación y de actualización, con las acciones Editar y Eliminar | `GET /api/users/:id` |

Las filas en vivo de `#/activity` se pueden abrir porque `api:activity` trae el `id` del registro.

## Sesiones y `token_version`

Cada usuario tiene un número de versión de sesión, `token_version` (entero, 0 por defecto), guardado en el recurso `/users` de la API externa. Además cada inicio de sesión y cada renovación guardan una fila en `/sessions`, y al cambiar `token_version` esas filas se marcan con `revoked_at`; es solo un registro, la validez sigue dependiendo del JWT y de `token_version`. El modelo `User` lo lee como `tokenVersion`.

- Los dos tokens (acceso y renovación) llevan `ver`, la versión del usuario al emitirse.
- En cada petición y en cada renovación se compara `ver` con la versión actual. Si no coincide, responde 401 "La sesión ya no es válida".
- Cambiar la contraseña (`PATCH /users/:id/password`, propia o hecha por el administrador) suman 1 a `token_version`, así que se cierran las demás sesiones, incluidos los tokens de renovación robados.
- Quien cambia **su propia** contraseña recibe un `SessionResponseDto` con tokens nuevos y el frontend los guarda, así que sigue conectado en ese dispositivo. Si el administrador cambia la de otro usuario, la respuesta es solo un `MessageResponseDto`.

## Equivalencias con el documento de requerimientos

`POST /auth/verify-code` del documento corresponde a `POST /auth/register/verify` y `POST /auth/login/verify`; `/auth/verify-registration`, a `/auth/register/verify`; `/auth/resend-registration`, a `/auth/register/resend-code`; y `/auth/resend-code`, a `/auth/login/resend-code`. El detalle (`/monitoring/endpoints/:id` y `/metrics/requests/:id`) es una ampliación del tablero. `POST /api/axonApi` se mantiene como alias de `POST /api/simulations`. Socket.IO se reemplazó por Server-Sent Events, que no necesita dependencias adicionales.

Se usa un único servidor (puerto 4000) en lugar de dos (5173 y 4000). Los DTO de los diagramas (`UsuarioDTO.cs`) equivalen a los de `BACKEND/esquemas/DTOs_Usuarios_Autenticacion.js` (petición y respuesta), y `validarCredenciales` a `validateCredentials`.

## API de la base de datos externa

La base tiene **19 tablas sin ciclos** (árbol de 18 relaciones). Cada tabla es un recurso de la API externa con las mismas operaciones: `GET /recurso` (filtros de igualdad por query, `page`, `limit` → `{ data, total }`), `GET /recurso/:id`, `POST /recurso`, `PATCH /recurso/:id` y `DELETE /recurso/:id`. Cada petición envía la clave en `x-api-key` y los datos viajan en JSON con los nombres de columna (`password_hash`, `role_id`, `created_at`...).

| Grupo | Recursos (tabla) |
|---|---|
| Usuarios | `/roles`, `/user-statuses`, `/users` (`role_id`, `status_id`), `/sessions`, `/login-attempts`, `/user-audit` |
| Códigos y correo | `/code-purposes`, `/verification-codes` (`purpose_id`), `/sent-emails` |
| Tiempo real | `/live-connections` |
| Monitoreo | `/http-methods`, `/endpoints` (`method_id`), `/http-status-codes`, `/request-logs` (`endpoint_id`, `user_id`, `status_code_id`) |
| Simulación y servicios | `/simulations` (`request_log_id`), `/layers`, `/simulation-layers`, `/services`, `/service-checks` |

Los catálogos (`roles`, `user_statuses`, `code_purposes`, `http_methods`, `http_status_codes`, `layers`, `services`) se leen una vez y quedan en la caché de `modelos/catalogo.js`, que traduce nombre ↔ id. El modelo `User` sigue mostrando `role` como `admin`, `user` o `inactive` (cuando el estado es `inactive`); eliminar un usuario es ponerle el estado `inactive`.

**Qué se guarda y cuándo** (los registros secundarios nunca rompen la petición: si fallan, se ignoran):

| Tabla | Se escribe cuando |
|---|---|
| `user_audit` | Se crea, edita o elimina un usuario o un administrador cambia la contraseña de otro (`user_id` es quien actúa, `target_email` el afectado) |
| `login_attempts` | Cada intento de login, correcto o no |
| `sessions` | Al verificar el login, al renovar y al cambiar la contraseña propia; `revoked_at` cuando cambia `token_version` |
| `sent_emails` | Cada correo con un código |
| `live_connections` | Al abrir y cerrar cada conexión del stream (`closed_at`, `close_reason`) |
| `request_logs` | Cada petición a la API (`endpoint_id` es nulo si la ruta no está vigilada) |
| `simulations` y `simulation_layers` | Cada simulación, con sus tiempos en vista, controlador, servicio y modelo |
| `service_checks` | Cada `GET /api/metrics/services`, una fila por servicio |

Consultas especiales que se conservan:

| Método | Ruta | Uso |
|---|---|---|
| GET | `/health` | Comprobar que la API responde (y medir su latencia) |
| GET | `/users?email=&includeInactive=true&limit=1` | Buscar por correo (incluye inactivos); sin `includeInactive` solo salen los activos |
| GET | `/users/count-by-role` | `{ admin, user, inactive }` |
| GET | `/verification-codes/active?email=&purpose_id=` | Último código vigente (404 si no hay) |
| POST | `/verification-codes/:id/attempts` | Sumar un intento |
| POST | `/verification-codes/invalidate` | Invalidar los códigos anteriores (`email` y `purpose_id`) |
| GET | `/request-logs?page=&limit=&method=&statusClass=&route=` | Historial del más nuevo al más viejo; `statusClass` es `2xx`, `3xx`, `4xx` o `5xx`; `route` filtra por el patrón de la ruta |
| GET | `/request-logs/summary` | `{ total, last24h, avgLatencyMs, byStatus, byMethod }` |
| GET | `/request-logs/stats-by-route` | `{ data: [{ method, route, total, errors, avgLatencyMs, lastRequestAt }] }` (`errors` cuenta códigos 400 o superiores) |

`path` se guarda sin la query y `route` es la ruta en forma de patrón (`/api/users/15` se guarda como `/api/users/:id`), para agrupar las estadísticas por endpoint.

Si la API externa no responde, el backend devuelve 503; si responde con error, 502.

## Instalación

**Requisitos:** Node.js 18 o superior, y la dirección y la clave de la API de la base de datos externa.

Todos los comandos se ejecutan desde la carpeta `BACKEND` (`cd BACKEND`).

**1. Instalar dependencias**

```bash
npm install
```

**2. Configurar la conexión.** Copia el archivo de ejemplo y complétalo:

```bash
cp .env.example .env       # Windows: copy .env.example .env
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
| `npm run pruebas:integracion` | Solo pruebas de la API (necesitan `BACKEND/.env` y la API de la base de datos disponible) |
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
- Las sesiones se cierran al cambiar la contraseña (`token_version`).
- Validación de todos los datos de entrada antes de enviarlos a la base de datos.
- El proyecto no tiene acceso directo a la base: solo usa su API, con una clave y un tiempo máximo de espera.
- Cabeceras de seguridad con Helmet y una política de contenido (CSP) que solo permite scripts propios (Chart.js se sirve desde el mismo servidor en `/vendor`) y las fuentes de Google.
- Mismo origen para la API y la interfaz, así que no se abre CORS.
- Credenciales solo en `BACKEND/.env`, excluido del repositorio.
