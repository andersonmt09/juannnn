# Frontend — Vista

SPA en HTML, CSS y JavaScript con módulos ES. No accede a la base de datos: todo lo pide a la API.

```
main.js → router/ → views/<módulo>/<pantalla>.view.js → services/*.service.js → http.client.js → API
```

| Carpeta | Contenido |
|---|---|
| `src/config/` | `API_BASE_URL` y claves de almacenamiento |
| `src/router/` | `routes.js` (ruta → vista, públicas / privadas / solo admin) y `router.js` |
| `src/views/` | Una carpeta por módulo: `auth/`, `dashboard/`, `users/`, `endpoints/`, `profile/` |
| `src/components/` | Layout (menú lateral), modal, gráfica, encabezado, estado vacío |
| `src/services/` | `http.client.js` (tokens y renovación de sesión) y un servicio por recurso de la API |
| `src/utils/` | Construcción segura de HTML, iconos, notificaciones, exportar CSV |
| `assets/` | Estilos e imágenes |

## Ejecutar

```bash
node frontend/server.js    # http://localhost:5500
```

Debe abrirse por http (no con doble clic en `index.html`) porque usa módulos ES. Si la API está en otra dirección, cambiar `API_BASE_URL` en `src/config/app.config.js`.

| Ruta | Vista | Acceso |
|---|---|---|
| `#/login` | `views/auth/login.view.js` | Pública |
| `#/register` | `views/auth/register.view.js` | Pública |
| `#/verify` | `views/auth/verify.view.js` | Pública |
| `#/dashboard` | `views/dashboard/dashboard.view.js` | Con sesión |
| `#/users` | `views/users/users.view.js` | Solo admin |
| `#/endpoints` | `views/endpoints/endpoints.view.js` | Con sesión |
| `#/profile` | `views/profile/profile.view.js` | Con sesión |
