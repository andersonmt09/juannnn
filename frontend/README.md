# Frontend

Interfaz web en HTML, CSS y JavaScript. No se conecta a la base de datos; todos los datos los pide a la API.

## Flujo

```
main.js → router/ → views/ → api/ → backend
```

| Carpeta | Contenido |
|---|---|
| `src/views/` | Una carpeta por módulo: `auth`, `dashboard`, `users`, `endpoints`, `profile` |
| `src/components/` | Menú lateral, modal, gráfica, encabezado y estado vacío |
| `src/api/` | `http-client.js` y un archivo por recurso del backend |
| `src/store/` | Sesión del usuario (tokens y datos) |
| `src/router/` | `routes.js` (rutas y permisos) y `router.js` |
| `src/config/` | URL de la API |
| `src/utils/` | Creación de elementos, iconos, notificaciones y CSV |
| `assets/css/` | `main.css` importa `variables`, `base`, `layout`, `components` y `auth` |

## Rutas

| Ruta | Vista | Acceso |
|---|---|---|
| `#/login` | `views/auth/login.view.js` | Público |
| `#/register` | `views/auth/register.view.js` | Público |
| `#/verify` | `views/auth/verify.view.js` | Público |
| `#/dashboard` | `views/dashboard/dashboard.view.js` | Con sesión |
| `#/users` | `views/users/users.view.js` | Administrador |
| `#/endpoints` | `views/endpoints/endpoints.view.js` | Con sesión |
| `#/profile` | `views/profile/profile.view.js` | Con sesión |

## Ejecutar

```bash
npm run frontend    # desde la carpeta raíz → http://localhost:5500
```

Se debe abrir por `http://localhost:5500` (no con doble clic en `index.html`). Si la API está en otra dirección, cambia `API_BASE_URL` en `src/config/app.config.js`.
