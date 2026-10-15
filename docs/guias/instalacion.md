# Guía de instalación

## Requisitos

- **Node.js 18 o superior** — https://nodejs.org
- **Acceso a una base de datos MySQL 8 externa** (host, puerto, usuario, contraseña y nombre de la base). La base de datos no viene con el proyecto.
- (Opcional) Una cuenta SMTP para enviar los códigos por correo. Sin SMTP, los códigos aparecen en la consola del backend.

## 1. Preparar la base de datos (una sola vez)

El administrador del servidor MySQL ejecuta [`docs/04-base-de-datos/script-creacion.sql`](../04-base-de-datos/script-creacion.sql). Crea la base `axon_db` y sus 4 tablas.

## 2. Configurar el backend

```bash
cd backend
npm install
```

Copia el archivo de ejemplo y complétalo:

```bash
# Windows
copy .env.example .env
# Linux / macOS
cp .env.example .env
```

Datos mínimos en `backend/.env`:

| Variable | Ejemplo | Descripción |
|---|---|---|
| `DB_HOST` | `mi-servidor.com` | Servidor de la base de datos externa |
| `DB_PORT` | `3306` | Puerto |
| `DB_USER` / `DB_PASSWORD` | — | Credenciales entregadas por el administrador |
| `DB_NAME` | `axon_db` | Nombre de la base |
| `DB_SSL` | `false` | `true` si el proveedor exige conexión cifrada |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | texto largo aleatorio | Mínimo 16 caracteres cada uno |

> `backend/.env` contiene secretos: está en `.gitignore` y **nunca** se sube a GitHub.

## 3. Crear el primer administrador

```bash
npm run create-admin -- "Nombre Apellido" admin@correo.com "ContraseñaSegura1"
```

## 4. Iniciar

Terminal 1 — API:

```bash
cd backend
npm start            # http://localhost:4000/api
```

Terminal 2 — Interfaz:

```bash
node frontend/server.js   # http://localhost:5500
```

Abre http://localhost:5500. Si la API está en otra dirección, cámbiala en `frontend/src/config/app.config.js` (`API_BASE_URL`) y agrega el origen del frontend a `FRONTEND_ORIGIN` en `backend/.env`.

## 5. Comprobar

```bash
cd backend
npm test                    # pruebas unitarias (no necesitan BD)
npm run test:integration    # con la API encendida
```

También puedes abrir http://localhost:4000/api/health: debe responder `"database": "ok"`.

## Problemas comunes

| Mensaje | Solución |
|---|---|
| `[env] Faltan variables de entorno` | Completa `backend/.env` |
| `No se pudo conectar a la base de datos` | Revisa host, puerto, usuario y contraseña; que el servidor acepte conexiones desde tu IP |
| La página queda en blanco | Abre el frontend con `node frontend/server.js`, no con doble clic en `index.html` |
| Error de CORS en el navegador | Agrega la URL del frontend a `FRONTEND_ORIGIN` |
| No llega el correo | Sin SMTP el código se imprime en la consola del backend |
