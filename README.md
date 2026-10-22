# AXON Stack Flow

Aplicación web para administrar usuarios con inicio de sesión en dos pasos (contraseña + código enviado al correo) y monitorear el uso de su propia API.

| Parte | Carpeta | Tecnología |
|---|---|---|
| Backend (API REST) | `backend/` | Node.js, Express, JWT, bcrypt |
| Frontend (interfaz web) | `frontend/` | HTML, CSS y JavaScript (módulos ES) |
| Base de datos | Externa | Se consulta por medio de su API — no hay código de base de datos en el proyecto |

## Funcionalidades

- Registro de usuarios con verificación del correo.
- Inicio de sesión en dos pasos y renovación automática de la sesión.
- Gestión de usuarios por roles (administrador y usuario) con eliminación lógica.
- Registro de endpoints para monitoreo.
- Panel con métricas de las peticiones a la API.
- Exportación de usuarios y actividad a CSV.
- Tema claro y oscuro.

## Arquitectura

El proyecto sigue el patrón **Modelo – Vista – Controlador**. El frontend nunca se conecta a la base de datos: todo lo pide al backend, y el backend a su vez pide los datos a la API de la base de datos externa.

```
FRONTEND (Vista)                        BACKEND (Controlador y Modelo)                                    BASE DE DATOS

vistas/ → servicios-api/ ── HTTP ──►  api/rutas → seguridad/intermediarios → api/validadores → api/controladores
              │                                                                     │
           estado/ (sesión)                                             casos-de-uso/ → modelos/ ──►  API de la base de datos externa
                                                                                │
                                                                         proveedores/ (correo, tokens)
```

## Relación con el diseño del sistema

La organización del backend sigue el mismo flujo del diseño: **RF / RNF → Casos de uso / Endpoints → Base de datos → Diagrama de clases, secuencia y actividades**.

| Elemento del diseño | Carpeta | Contenido |
|---|---|---|
| Endpoints y validación de los RF | `backend/codigo/api/` | `rutas/` (cada endpoint), `validadores/` (datos de entrada y salida) y `controladores/` (reciben la petición y responden) |
| Casos de uso, secuencia y actividades | `backend/codigo/casos-de-uso/` | Flujos del negocio: autenticación, usuarios, endpoints, métricas y códigos de verificación |
| RNF (seguridad) | `backend/codigo/seguridad/` | `constantes/` (roles y parámetros de seguridad) e `intermediarios/` (autenticación, roles, límite de intentos, registro de peticiones, validación y errores) |
| Base de datos | `backend/codigo/base-datos/` | `cliente-bd.js`: único punto de salida hacia la API de la base de datos externa; `crear-admin.js` |
| Diagrama de clases | `backend/codigo/modelos/` | Una clase por entidad; única capa que pide datos a la base de datos externa |
| Servicios técnicos | `backend/codigo/proveedores/` | Envío de correos y tokens JWT, separados de la lógica de negocio |
| Vista | `frontend/codigo/vistas/` | Pantallas que ve el usuario |

La base de datos **no forma parte del proyecto**: aquí no hay SQL, tablas ni conexión directa. Los modelos llaman a la API de la base de datos externa mediante `base-datos/cliente-bd.js`, con la dirección y la clave definidas en `backend/.env`, archivo que no se sube al repositorio.

## Estructura de carpetas

```
axon-stack-flow/
├── backend/
│   ├── codigo/
│   │   ├── api/
│   │   │   ├── rutas/              indice.js (agrupa todas), autenticacion, usuarios, endpoints, metricas, salud
│   │   │   ├── validadores/        base, autenticacion, usuarios, endpoints
│   │   │   └── controladores/      autenticacion, usuarios, endpoints, metricas, salud
│   │   ├── casos-de-uso/           autenticacion, codigos-verificacion, usuarios, endpoints, metricas
│   │   ├── proveedores/            correo.js, tokens.js
│   │   ├── modelos/                usuario, codigo-verificacion, endpoint, registro-peticion
│   │   ├── base-datos/             cliente-bd.js (llamadas a la API externa), crear-admin.js
│   │   ├── seguridad/
│   │   │   ├── constantes/         roles.js, seguridad.js
│   │   │   └── intermediarios/     autenticacion, limite-intentos, registro-peticiones, validacion, errores
│   │   ├── configuracion/          entorno.js
│   │   ├── utilidades/             error-http, manejador-async, validaciones
│   │   ├── aplicacion.js           Configuración de Express
│   │   └── arranque.js             Encendido del servidor
│   ├── pruebas/
│   │   ├── unitarias/              utilidades.test.js, validadores.test.js
│   │   └── integracion/            api.test.js
│   └── .env.example
│
├── frontend/
│   ├── codigo/
│   │   ├── vistas/                 autenticacion, panel, usuarios, endpoints, perfil
│   │   ├── componentes/            menu, modal, grafica, encabezado, estado-vacio
│   │   ├── servicios-api/          autenticacion, usuarios, endpoints, metricas
│   │   ├── configuracion/          api.js (URL del backend), cliente-http.js
│   │   ├── estado/                 sesion.js
│   │   ├── enrutador/              rutas.js, enrutador.js
│   │   ├── utilidades/             dom, iconos, notificaciones, csv
│   │   └── principal.js            Punto de entrada
│   ├── recursos/
│   │   ├── estilos/                principal.css importa variables, base, estructura, componentes y autenticacion
│   │   └── imagenes/
│   ├── automatizacion/             servidor-local.js
│   └── index.html
│
├── package.json
└── README.md
```

Cada recurso tiene el mismo nombre en todas las capas. Por ejemplo, **usuarios**:

| Capa | Archivo |
|---|---|
| Vista | `frontend/codigo/vistas/usuarios.js` |
| Servicio de la API | `frontend/codigo/servicios-api/usuarios.js` |
| Ruta | `backend/codigo/api/rutas/usuarios.js` |
| Validador | `backend/codigo/api/validadores/usuarios.js` |
| Controlador | `backend/codigo/api/controladores/usuarios.js` |
| Caso de uso | `backend/codigo/casos-de-uso/usuarios.js` |
| Modelo | `backend/codigo/modelos/usuario.js` |

Los nombres de carpetas y archivos están en español; el código interno (variables, funciones, clases y endpoints) está en inglés.

## Endpoints

Todas las rutas empiezan por `/api`. **Sesión** indica que la ruta exige el token de acceso (`Authorization: Bearer <token>`); **Admin**, que además exige rol de administrador.

| Recurso | Método | Ruta | Acceso |
|---|---|---|---|
| Estado | GET | `/health` | Público |
| Autenticación | POST | `/auth/register` | Público |
| | POST | `/auth/register/verify` | Público |
| | POST | `/auth/register/resend-code` | Público |
| | POST | `/auth/login` | Público |
| | POST | `/auth/login/verify` | Público |
| | POST | `/auth/login/resend-code` | Público |
| | POST | `/auth/refresh-token` | Público |
| Usuarios | GET | `/users` | Sesión |
| | GET | `/users/:id` | Sesión |
| | POST | `/users` | Admin |
| | PUT | `/users/:id` | Admin |
| | PATCH | `/users/:id/password` | Sesión (propio usuario o admin) |
| | DELETE | `/users/:id` | Admin |
| Endpoints | GET | `/endpoints` | Sesión |
| | POST | `/endpoints` | Admin |
| | DELETE | `/endpoints/:id` | Admin |
| Métricas | GET | `/metrics/dashboard` | Sesión |

Respuesta correcta: `{ "ok": true, ... }` · Respuesta con error: `{ "ok": false, "message": "..." }`

## API de la base de datos externa

Los modelos usan los siguientes recursos de la API externa. Cada petición envía la clave en el encabezado `x-api-key` y los datos viajan en JSON con los nombres de columna de la base (`password_hash`, `email_verified`, `created_at`...).

| Modelo | Método | Ruta | Uso |
|---|---|---|---|
| Estado | GET | `/health` | Comprobar que la API responde |
| `usuario.js` | GET | `/users?email=&includeInactive=&page=&limit=` | Buscar y listar usuarios → `{ data, total }` |
| | GET | `/users/:id` | Un usuario (404 si no existe) |
| | GET | `/users/count-by-role` | `{ admin, user, inactive }` |
| | POST | `/users` | Crear usuario |
| | PATCH | `/users/:id` | Editar datos, contraseña, verificación o rol |
| `codigo-verificacion.js` | POST | `/verification-codes` | Guardar un código (hash) |
| | GET | `/verification-codes/active?email=&purpose=` | Último código vigente (404 si no hay) |
| | POST | `/verification-codes/:id/attempts` | Sumar un intento |
| | PATCH | `/verification-codes/:id` | Marcar como usado |
| | POST | `/verification-codes/invalidate` | Invalidar los códigos anteriores |
| `endpoint.js` | GET | `/endpoints`, `/endpoints/:id`, `/endpoints/count` | Consultar endpoints monitoreados |
| | POST / DELETE | `/endpoints`, `/endpoints/:id` | Crear y eliminar |
| `registro-peticion.js` | POST | `/request-logs` | Registrar una petición |
| | GET | `/request-logs?limit=` | Últimas peticiones → `{ data }` |
| | GET | `/request-logs/summary` | `{ total, last24h, avgLatencyMs, byStatus, byMethod }` |

Si la API externa no responde, el backend devuelve 503; si responde con error, 502.

## Instalación

**Requisitos:** Node.js 18 o superior y la dirección y clave de la API de la base de datos externa.

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
| `DATABASE_API_URL` | Dirección de la API de la base de datos externa |
| `DATABASE_API_KEY` | Clave de acceso a esa API |
| `DATABASE_API_TIMEOUT_MS` | Tiempo máximo de espera por petición (por defecto 5000) |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Textos secretos de al menos 16 caracteres |
| `FRONTEND_ORIGIN` | Direcciones del frontend permitidas por CORS |
| `SMTP_*` | Opcional. Sin SMTP, los códigos de verificación se muestran en la consola del backend |

**3. Crear el primer administrador** (una sola vez; se guarda en la base de datos externa)

```bash
npm run crear-admin -- "Nombre Apellido" admin@correo.com "Contrasena1"
```

**4. Iniciar.** En dos terminales:

```bash
npm run backend       # API      →  http://localhost:4000/api
npm run frontend      # Interfaz →  http://localhost:5500
```

Abre http://localhost:5500 e inicia sesión con el administrador creado.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run backend` | Inicia la API |
| `npm run backend:dev` | Inicia la API y la reinicia al guardar cambios |
| `npm run frontend` | Inicia el servidor local del frontend |
| `npm run crear-admin -- "Nombre" correo "Clave"` | Crea un usuario administrador |
| `npm test` | Todas las pruebas (unitarias e integración) |
| `npm run pruebas:unitarias` | Solo pruebas unitarias (no necesitan base de datos) |
| `npm run pruebas:integracion` | Solo pruebas de la API (necesitan `backend/.env` y la API de la base de datos disponible) |

## Seguridad

- Contraseñas y códigos guardados con bcrypt.
- Tokens JWT: acceso de 8 horas y renovación de 7 días.
- Códigos de 6 dígitos que vencen en 5 minutos y permiten 5 intentos.
- Máximo 5 intentos fallidos de autenticación por IP cada 15 minutos.
- Validación de todos los datos de entrada antes de enviarlos a la base de datos.
- El proyecto no tiene acceso directo a la base: solo usa su API con una clave y un tiempo máximo de espera.
- Cabeceras de seguridad con Helmet y CORS limitado a las direcciones del frontend.
- Credenciales solo en `backend/.env`, excluido del repositorio.
