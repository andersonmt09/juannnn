# AXON Stack Flow

Aplicación web para administrar usuarios con inicio de sesión en dos pasos (contraseña + código enviado al correo) y observar en tiempo real cómo se usa su propia API.

| Parte | Carpeta | Tecnología |
|---|---|---|
| Backend (API REST) | `backend/` | Node.js 18+, Express 4, JWT, bcrypt, Server-Sent Events |
| Frontend (interfaz web) | `frontend/` | HTML, CSS y JavaScript (módulos ES), servido por el mismo backend |
| Base de datos | Externa | Se consulta por medio de su API. No hay código de base de datos en el proyecto |

## Funcionalidades

- Registro con verificación del correo e inicio de sesión en dos pasos (código de 6 dígitos).
- Sesión con token de 15 minutos que se renueva sola.
- Gestión de usuarios por roles (administrador y usuario), con paginación, confirmaciones y eliminación lógica.
- Panel de control (solo administradores): cinco indicadores, arquitectura visual, gráficas, estado de los servicios y actividad reciente.
- Simulación de una petición que recorre las cuatro capas: Cliente, API, Backend y Base de datos.
- Actividad en vivo (solo administradores): cada petición a la API aparece al instante, con medición de latencia e historial filtrable.
- Monitoreo de endpoints: peticiones, errores, latencia y estado (saludable, con errores o sin tráfico) de cada ruta vigilada.
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
│   ├── controladores/      autenticacion, usuarios, monitoreo, metricas, simulacion, eventos
│   ├── servicios/          autenticacion, usuarios, monitoreo, metricas, simulacion, eventos
│   ├── rutas/              index + un archivo por recurso
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
│   │   ├── modelos/        sesion (sesión y tema), api (un llamado por endpoint), eventos (tiempo real)
│   │   ├── vistas/         inicio-sesion, registro, verificacion, panel, usuarios, monitoreo, actividad, perfil
│   │   │                   + componentes (menú, tablas, tarjetas, modal, gráficas, arquitectura...)
│   │   ├── controladores/  los mismos nombres que vistas/ + menu (tema, cierre de sesión y estado)
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
| **Controlador** | `controladores/` | Recibe la petición ya validada (`req.dto`), llama al servicio y responde con la vista |
| Servicios | `servicios/` | Reglas de negocio. Devuelven datos del dominio, no respuestas HTTP |
| Rutas | `rutas/` | Cada endpoint: método, URL, quién puede entrar, qué vista valida y qué controlador responde |
| Middlewares | `middlewares/` | Token y roles, límite de intentos, validación, registro de peticiones y errores |

### Frontend

| Capa | Carpeta | Responsabilidad |
|---|---|---|
| **Modelo** | `js/modelos/` | Estado del cliente (sesión y tema), las llamadas al backend y la conexión en tiempo real |
| **Vista** | `js/vistas/` | Una por pantalla. Solo dibuja los datos que recibe y avisa de los eventos (`onSave`, `onDelete`…). No llama a la API ni navega |
| **Controlador** | `js/controladores/` | Uno por pantalla. Pide los datos al modelo, se los pasa a la vista, atiende sus eventos, muestra los mensajes y las confirmaciones y decide la navegación |

Cada recurso tiene el mismo nombre en todas las capas. Por ejemplo, **usuarios**:

| Capa | Archivo |
|---|---|
| Vista (frontend) | `frontend/js/vistas/usuarios.js` |
| Controlador (frontend) | `frontend/js/controladores/usuarios.js` |
| Llamado a la API | `userApi` en `frontend/js/modelos/api.js` |
| Ruta | `backend/rutas/usuarios.js` |
| Vista (DTO de petición y respuesta) | `backend/vistas/usuarios.js` |
| Controlador (backend) | `backend/controladores/usuarios.js` |
| Servicio | `backend/servicios/usuarios.js` |
| Modelo | `backend/modelos/usuario.js` |

Los nombres de carpetas y archivos están en español; el código interno (variables, funciones, clases y endpoints) está en inglés.

## Endpoints

Todas las rutas empiezan por `/api`. **Sesión** indica que la ruta exige el token de acceso (`Authorization: Bearer <token>`); **Admin**, que además exige rol de administrador. Las vistas están en `backend/vistas/` con el nombre del recurso, y el llamado está en `frontend/js/modelos/api.js`.

| Método | Ruta | Acceso | Vista de petición (req) | Vista de respuesta (res) | Llamado en el frontend |
|---|---|---|---|---|---|
| GET | `/health` | Público | — | `HealthResponseDto` | `systemApi.getHealth` |
| POST | `/auth/register` | Público | `RegisterRequestDto` | `VerificationRequiredResponseDto` | `authApi.register` |
| POST | `/auth/register/verify` | Público | `VerifyCodeRequestDto` | `EmailVerifiedResponseDto` | `authApi.verifyRegistration` |
| POST | `/auth/register/resend-code` | Público | `ResendCodeRequestDto` | `MessageResponseDto` | `authApi.resendRegistrationCode` |
| POST | `/auth/login` | Público | `LoginRequestDto` | `VerificationRequiredResponseDto` | `authApi.login` |
| POST | `/auth/login/verify` | Público | `VerifyCodeRequestDto` | `SessionResponseDto` | `authApi.verifyLogin` |
| POST | `/auth/login/resend-code` | Público | `ResendCodeRequestDto` | `MessageResponseDto` | `authApi.resendLoginCode` |
| POST | `/auth/refresh-token` | Público | `RefreshTokenRequestDto` | `SessionResponseDto` | `authApi.refreshToken` (automático) |
| GET | `/users?page=&limit=` | Admin | `ListUsersRequestDto` | `UserListResponseDto` | `userApi.list`, `userApi.listAll` |
| GET | `/users/:id` | Sesión (propio o admin) | `UserIdRequestDto` | `UserResponseDto` | `userApi.get` |
| POST | `/users` | Admin | `CreateUserRequestDto` | `UserResponseDto` | `userApi.create` |
| PUT | `/users/:id` | Admin | `UpdateUserRequestDto` | `UserResponseDto` | `userApi.update` |
| PATCH | `/users/:id/password` | Sesión (propio o admin) | `ChangePasswordRequestDto` | `MessageResponseDto` | `userApi.changePassword` |
| DELETE | `/users/:id` | Admin | `UserIdRequestDto` | `MessageResponseDto` | `userApi.remove` |
| GET | `/monitoring/routes` | Admin | — | `ApiRouteListResponseDto` | `monitoringApi.listApiRoutes` |
| GET | `/monitoring/endpoints` | Sesión | — | `MonitoredEndpointListResponseDto` | `monitoringApi.listEndpoints` |
| POST | `/monitoring/endpoints` | Admin | `CreateMonitoredEndpointRequestDto` | `MonitoredEndpointResponseDto` | `monitoringApi.addEndpoint` |
| DELETE | `/monitoring/endpoints/:id` | Admin | `MonitoredEndpointIdRequestDto` | `MessageResponseDto` | `monitoringApi.removeEndpoint` |
| GET | `/metrics/dashboard` | Admin | — | `DashboardResponseDto` | `metricApi.getDashboard` |
| GET | `/metrics/requests?page=&limit=&method=&statusClass=` | Admin | `ListRequestLogsRequestDto` | `RequestLogListResponseDto` | `metricApi.listRequests` |
| GET | `/metrics/services` | Admin | — | `ServiceListResponseDto` | `metricApi.getServices` |
| POST | `/simulations` (alias `/axonApi`) | Admin | `RunSimulationRequestDto` | `SimulationResponseDto` | `simulationApi.run` |
| GET | `/events/stream?token=` | Admin | `StreamRequestDto` | Eventos SSE (ver abajo) | `stream.connect` en `js/modelos/eventos.js` |
| POST | `/events/ping` | Admin | — | `PongResponseDto` | `eventApi.ping` |

Cualquier error responde con `ErrorResponseDto`: `{ "ok": false, "message": "...", "errors": [...], "code": "..." }`. Una ruta que no existe responde 404 con `{ "message": "Endpoint no encontrado", "path", "method" }`.

**Tiempo real (Server-Sent Events).** `GET /api/events/stream` mantiene la conexión abierta y envía estos eventos:

| Evento | Cuándo | Datos |
|---|---|---|
| `stream:connected` | Al conectarse | Cliente y hora |
| `stream:heartbeat` | Cada 15 segundos | Clientes conectados y tiempo activo |
| `api:activity` | Cada petición a la API | Método, ruta, estado, latencia y hora |
| `stream:pong` | Respuesta a `POST /events/ping` | Hora, para medir la latencia |

El navegador no permite enviar encabezados con `EventSource`, por eso el token va en `?token=`. Las rutas se guardan sin la query, así que el token nunca queda registrado.

**Reglas de negocio**

- Para cambiar la contraseña propia hay que enviar la actual (`currentPassword`). El administrador puede cambiar la de otros sin ella.
- Nadie puede eliminarse a sí mismo ni cambiar su propio rol, y siempre debe quedar al menos un administrador activo.
- Solo se pueden monitorear rutas que existen en la API, y cada una una sola vez. Un endpoint está "con errores" si el 20 % o más de sus respuestas fallan.
- En cada petición se comprueba que el usuario del token siga activo: una cuenta eliminada pierde el acceso de inmediato.
- El reenvío de código responde lo mismo exista o no el correo, para no revelar qué cuentas existen.

**Equivalencias con el documento de requerimientos.** `POST /auth/verify-code` del documento corresponde a `POST /auth/register/verify` y `POST /auth/login/verify`. `POST /api/axonApi` se mantiene como alias de `POST /api/simulations`. Socket.IO se reemplazó por Server-Sent Events, que no necesita dependencias adicionales. Se usa un único servidor (puerto 4000) en lugar de dos (5173 y 4000).

## API de la base de datos externa

Los modelos usan los siguientes recursos de la API externa. Cada petición envía la clave en el encabezado `x-api-key`, y los datos viajan en JSON con los nombres de columna de la base (`password_hash`, `email_verified`, `created_at`...).

| Modelo | Método | Ruta | Uso |
|---|---|---|---|
| `base-datos.js` | GET | `/health` | Comprobar que la API responde (y medir su latencia) |
| `usuario.js` | GET | `/users?page=&limit=` | Usuarios activos paginados → `{ data, total }` |
| | GET | `/users?email=&includeInactive=true&limit=1` | Buscar por correo (incluye inactivos) |
| | GET | `/users/:id` | Un usuario (404 si no existe) |
| | GET | `/users/count-by-role` | `{ admin, user, inactive }` |
| | POST | `/users` | Crear usuario |
| | PATCH | `/users/:id` | Editar datos, contraseña, verificación o rol |
| `codigo-verificacion.js` | POST | `/verification-codes` | Guardar un código (hash) |
| | GET | `/verification-codes/active?email=&purpose=` | Último código vigente (404 si no hay) |
| | POST | `/verification-codes/:id/attempts` | Sumar un intento |
| | PATCH | `/verification-codes/:id` | Marcar como usado |
| | POST | `/verification-codes/invalidate` | Invalidar los códigos anteriores |
| `endpoint-monitoreado.js` | GET | `/endpoints`, `/endpoints/:id` | Endpoints monitoreados → `{ data }` |
| | POST / DELETE | `/endpoints`, `/endpoints/:id` | Agregar y quitar |
| `registro-peticion.js` | POST | `/request-logs` | Registrar una petición (`method`, `path`, `route`, `status_code`, `latency_ms`, `source`, `user_id`) |
| | GET | `/request-logs?page=&limit=&method=&statusClass=` | Historial del más nuevo al más viejo → `{ data, total }`. `statusClass` es `2xx`, `3xx`, `4xx` o `5xx` |
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
- Máximo 5 intentos fallidos de autenticación por IP cada 15 minutos.
- Validación de todos los datos de entrada antes de enviarlos a la base de datos.
- El proyecto no tiene acceso directo a la base: solo usa su API, con una clave y un tiempo máximo de espera.
- Cabeceras de seguridad con Helmet y una política de contenido (CSP) que solo permite los recursos propios, Chart.js y las fuentes de Google.
- Mismo origen para la API y la interfaz, así que no se abre CORS.
- Credenciales solo en `backend/.env`, excluido del repositorio.
