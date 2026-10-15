# AXON Stack Flow

Aplicación web para administrar usuarios con inicio de sesión en dos pasos (contraseña + código enviado al correo) y monitorear el uso de su propia API.

| Parte | Tecnología |
|---|---|
| Backend | Node.js, Express, JWT, bcrypt |
| Frontend | HTML, CSS y JavaScript (módulos ES) |
| Base de datos | MySQL 8, externa al proyecto |

## Funcionalidades

- Registro de usuarios con verificación de correo.
- Inicio de sesión en dos pasos y renovación automática de la sesión.
- Gestión de usuarios por roles (administrador y usuario) con eliminación lógica.
- Registro de endpoints para monitoreo.
- Dashboard con métricas de las peticiones a la API.
- Exportación de usuarios y actividad a CSV.
- Tema claro y oscuro.

## Arquitectura

El proyecto sigue el patrón **Modelo – Vista – Controlador**:

```
FRONTEND (Vista)                 BACKEND (Controlador y Modelo)                 BASE DE DATOS

views/ → api/  ──── HTTP ────►  routes/ → controllers/ → services/ → models/ ──►  MySQL externa
```

- **Vista** (`frontend/src/views`): pantallas que ve el usuario. Nunca acceden a la base de datos; piden los datos a la API.
- **Controlador** (`backend/src/routes` y `backend/src/controllers`): cada ruta define un endpoint y su controlador recibe la petición y devuelve la respuesta.
- **Servicios** (`backend/src/services`): reglas de negocio.
- **Modelo** (`backend/src/models`): una clase por tabla. Es la única capa que consulta la base de datos.

La base de datos **no está dentro del proyecto**. El backend se conecta a un servidor MySQL externo con los datos del archivo `backend/.env`, que no se sube al repositorio.

## Relación con el diseño

La estructura del código sigue el mismo orden del diseño del sistema:

| Elemento del diseño | Dónde está en el código |
|---|---|
| Endpoints | `backend/src/routes/` (un archivo por recurso; `index.js` los reúne) |
| Base de datos | `backend/src/models/` (un modelo por tabla). La base de datos en sí está fuera del proyecto |
| Diagrama de clases | `models/` (entidades), `controllers/`, `services/` y `dtos/` |
| Diagrama de secuencia | Recorrido de una petición: vista → api → ruta → middlewares → controlador → servicio → modelo |
| Casos de uso | Cada vista de `frontend/src/views/` corresponde a una acción del usuario |
| Requerimientos no funcionales | `middlewares/` (seguridad, roles, validación, límite de intentos) y `constants/security.js` |

## Estructura de carpetas

```
axon-stack-flow/
├── backend/
│   ├── src/
│   │   ├── config/          Variables de entorno y conexión a la base de datos
│   │   ├── constants/       Roles y parámetros de seguridad
│   │   ├── routes/          Endpoints de la API (index.js agrupa todos)
│   │   ├── controllers/     Reciben la petición y responden
│   │   ├── services/        Lógica de negocio
│   │   ├── models/          Acceso a las tablas de la base de datos
│   │   ├── dtos/            Validación de datos de entrada y formato de salida
│   │   ├── middlewares/     Autenticación, roles, validación, límite de intentos, logs y errores
│   │   ├── utils/           Funciones de apoyo
│   │   ├── app.js           Configuración de Express
│   │   └── server.js        Arranque del servidor
│   ├── scripts/             create-admin.js
│   ├── tests/               unit/ e integration/
│   └── .env.example
│
├── frontend/
│   ├── assets/              css/ e img/
│   ├── src/
│   │   ├── views/           Pantallas: auth, dashboard, users, endpoints, profile
│   │   ├── components/      Partes reutilizables: menú, modal, gráfica...
│   │   ├── api/             Llamadas a cada endpoint del backend
│   │   ├── store/           Sesión del usuario
│   │   ├── router/          Rutas de la aplicación
│   │   ├── config/          URL de la API
│   │   ├── utils/           Funciones de apoyo
│   │   └── main.js          Punto de entrada
│   ├── index.html
│   └── server.js            Servidor local
│
├── package.json
└── README.md
```

Cada recurso usa el mismo nombre en todas las capas. Por ejemplo, para usuarios:

| Capa | Archivo |
|---|---|
| Vista | `frontend/src/views/users/users.view.js` |
| Llamadas a la API | `frontend/src/api/user.api.js` |
| Ruta | `backend/src/routes/user.routes.js` |
| Controlador | `backend/src/controllers/user.controller.js` |
| Servicio | `backend/src/services/user.service.js` |
| Modelo | `backend/src/models/user.model.js` |
| DTO | `backend/src/dtos/user.dto.js` |

## Endpoints

Todas las rutas empiezan por `/api`. **Sesión** indica que la ruta exige el token de acceso (`Authorization: Bearer <token>`); **Admin**, que además exige rol administrador.

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

## Instalación

**Requisitos:** Node.js 18 o superior y acceso a un servidor MySQL 8 con la base de datos `axon_db` ya creada.

```bash
# 1. Instalar dependencias del backend
cd backend
npm install

# 2. Configurar la conexión
cp .env.example .env      # Windows: copy .env.example .env
```

Completa `backend/.env`:

| Variable | Descripción |
|---|---|
| `DB_HOST`, `DB_PORT` | Servidor de la base de datos |
| `DB_USER`, `DB_PASSWORD` | Credenciales de MySQL |
| `DB_NAME` | Nombre de la base (`axon_db`) |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Textos secretos de al menos 16 caracteres |
| `SMTP_*` | Opcional. Sin SMTP, los códigos de verificación se muestran en la consola |

```bash
# 3. Crear el primer administrador
npm run create-admin -- "Nombre Apellido" admin@correo.com "Contraseña1"

# 4. Iniciar la API  →  http://localhost:4000/api
npm start
```

En otra terminal, desde la carpeta raíz:

```bash
# 5. Iniciar el frontend  →  http://localhost:5500
npm run frontend
```

## Pruebas

```bash
cd backend
npm test                   # Pruebas unitarias
npm run test:integration   # Pruebas de la API (con el servidor encendido)
```

## Seguridad

- Contraseñas y códigos guardados con bcrypt.
- Tokens JWT: acceso de 8 horas y renovación de 7 días.
- Códigos de 6 dígitos que vencen en 5 minutos y permiten 5 intentos.
- Máximo 5 intentos fallidos de inicio de sesión por IP cada 15 minutos.
- Validación de todos los datos de entrada y consultas SQL con parámetros.
- Cabeceras de seguridad con Helmet y CORS limitado al frontend.
