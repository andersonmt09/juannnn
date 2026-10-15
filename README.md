# AXON Stack Flow

Aplicación web para administrar usuarios con inicio de sesión en dos pasos (contraseña + código enviado al correo) y monitorear el uso de su propia API.

| Parte | Carpeta | Tecnología |
|---|---|---|
| Servidor (API REST) | `servidor/` | Node.js, Express, JWT, bcrypt |
| Cliente (interfaz web) | `cliente/` | HTML, CSS y JavaScript (módulos ES) |
| Base de datos | Externa | MySQL 8 — no está dentro del proyecto |

## Funcionalidades

- Registro de usuarios con verificación del correo.
- Inicio de sesión en dos pasos y renovación automática de la sesión.
- Gestión de usuarios por roles (administrador y usuario) con eliminación lógica.
- Registro de endpoints para monitoreo.
- Panel con métricas de las peticiones a la API.
- Exportación de usuarios y actividad a CSV.
- Tema claro y oscuro.

## Arquitectura

El proyecto sigue el patrón **Modelo – Vista – Controlador**. El cliente nunca se conecta a la base de datos: todo lo pide al servidor a través de la API.

```
CLIENTE (Vista)                          SERVIDOR (Controlador y Modelo)                              BASE DE DATOS

vistas/ → peticiones-api/ ── HTTP ──►  rutas/ → intermediarios/ → validadores/ → controladores/ → servicios/ → modelos/ ──►  MySQL externa
              │
           estado/ (sesión)
```

| Capa | Carpeta | Responsabilidad |
|---|---|---|
| Vista | `cliente/codigo/vistas/` | Pantallas que ve el usuario |
| Rutas | `servidor/codigo/rutas/` | Define cada endpoint de la API |
| Intermediarios | `servidor/codigo/intermediarios/` | Autenticación, roles, límite de intentos, registro de peticiones y errores |
| Validadores | `servidor/codigo/validadores/` | Revisan los datos de entrada y dan formato a la salida (DTOs) |
| Controlador | `servidor/codigo/controladores/` | Recibe la petición y devuelve la respuesta |
| Servicios | `servidor/codigo/servicios/` | Reglas de negocio |
| Modelo | `servidor/codigo/modelos/` | Una clase por tabla; única capa que consulta la base de datos |

La base de datos **no forma parte del proyecto**. El servidor se conecta a un MySQL externo con los datos de `servidor/.env`, archivo que no se sube al repositorio.

## Estructura de carpetas

```
axon-stack-flow/
├── servidor/
│   ├── codigo/
│   │   ├── configuracion/        entorno.js, base-datos.js
│   │   ├── constantes/           roles.js, seguridad.js
│   │   ├── rutas/                indice.js (agrupa todas), autenticacion, usuarios, endpoints, metricas, salud
│   │   ├── intermediarios/       autenticacion, validacion, limite-intentos, registro-peticiones, errores
│   │   ├── validadores/          base, autenticacion, usuarios, endpoints
│   │   ├── controladores/        autenticacion, usuarios, endpoints, metricas, salud
│   │   ├── servicios/            autenticacion, usuarios, endpoints, metricas, tokens, correo, codigos-verificacion
│   │   ├── modelos/              usuario, codigo-verificacion, endpoint, registro-peticion
│   │   ├── utilidades/           error-http, manejador-async, validaciones
│   │   ├── aplicacion.js         Configuración de Express
│   │   └── arranque.js           Encendido del servidor
│   ├── automatizacion/           inicializar-bd.js, crear-admin.js
│   ├── pruebas/                  unitarias/ e integracion/
│   └── .env.example
│
├── cliente/
│   ├── recursos/
│   │   ├── estilos/              principal.css importa variables, base, estructura, componentes y autenticacion
│   │   └── imagenes/
│   ├── codigo/
│   │   ├── vistas/               autenticacion, panel, usuarios, endpoints, perfil
│   │   ├── componentes/          menu, modal, grafica, encabezado, estado-vacio
│   │   ├── peticiones-api/       cliente-http.js y un archivo por recurso del servidor
│   │   ├── estado/               sesion.js
│   │   ├── enrutador/            rutas.js, enrutador.js
│   │   ├── configuracion/        api.js (URL del servidor)
│   │   ├── utilidades/           dom, iconos, notificaciones, csv
│   │   └── principal.js          Punto de entrada
│   ├── automatizacion/           servidor-local.js
│   └── index.html
│
├── package.json
└── README.md
```

Cada recurso tiene el mismo nombre en todas las capas. Por ejemplo, **usuarios**:

| Capa | Archivo |
|---|---|
| Vista | `cliente/codigo/vistas/usuarios.js` |
| Petición a la API | `cliente/codigo/peticiones-api/usuarios.js` |
| Ruta | `servidor/codigo/rutas/usuarios.js` |
| Validador | `servidor/codigo/validadores/usuarios.js` |
| Controlador | `servidor/codigo/controladores/usuarios.js` |
| Servicio | `servidor/codigo/servicios/usuarios.js` |
| Modelo | `servidor/codigo/modelos/usuario.js` |

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

## Instalación

**Requisitos:** Node.js 18 o superior y acceso a un servidor MySQL 8.

Todos los comandos se ejecutan desde la carpeta raíz del proyecto.

**1. Instalar dependencias**

```bash
npm install
```

**2. Configurar la conexión.** Copia el archivo de ejemplo y complétalo:

```bash
cp servidor/.env.example servidor/.env       # Windows: copy servidor\.env.example servidor\.env
```

| Variable | Descripción |
|---|---|
| `DB_HOST`, `DB_PORT` | Servidor de la base de datos |
| `DB_USER`, `DB_PASSWORD` | Credenciales de MySQL |
| `DB_NAME` | Nombre de la base (`axon_db`) |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Textos secretos de al menos 16 caracteres |
| `FRONTEND_ORIGIN` | Direcciones del cliente permitidas por CORS |
| `SMTP_*` | Opcional. Sin SMTP, los códigos de verificación se muestran en la consola del servidor |

**3. Preparar la base de datos** (una sola vez)

```bash
npm run inicializar-bd
npm run crear-admin -- "Nombre Apellido" admin@correo.com "Contrasena1"
```

**4. Iniciar.** En dos terminales:

```bash
npm run servidor      # API     →  http://localhost:4000/api
npm run cliente       # Interfaz →  http://localhost:5500
```

Abre http://localhost:5500 e inicia sesión con el administrador creado.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run servidor` | Inicia la API |
| `npm run servidor:dev` | Inicia la API y la reinicia al guardar cambios |
| `npm run cliente` | Inicia el servidor local del cliente |
| `npm run inicializar-bd` | Crea la base de datos y las tablas en el servidor MySQL |
| `npm run crear-admin -- "Nombre" correo "Clave"` | Crea un usuario administrador |
| `npm run pruebas` | Pruebas unitarias |
| `npm run pruebas:integracion` | Pruebas de la API (necesitan `servidor/.env` y la base de datos) |

## Seguridad

- Contraseñas y códigos guardados con bcrypt.
- Tokens JWT: acceso de 8 horas y renovación de 7 días.
- Códigos de 6 dígitos que vencen en 5 minutos y permiten 5 intentos.
- Máximo 5 intentos fallidos de autenticación por IP cada 15 minutos.
- Validación de todos los datos de entrada y consultas SQL con parámetros.
- Cabeceras de seguridad con Helmet y CORS limitado a las direcciones del cliente.
- Credenciales solo en `servidor/.env`, excluido del repositorio.
