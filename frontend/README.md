# Frontend - AXON Stack Flow (SPA)

Interfaz web (HTML/CSS/JS puro) en arquitectura SPA (Single Page Application).

## Estructura de carpetas

```
frontend/
├── css/
│   └── styles.css          # Sistema de diseño (variables, componentes, temas)
├── js/
│   ├── core/               # Utilidades compartidas
│   │   ├── config.js       # URL del API
│   │   ├── api.js          # Cliente HTTP + refresh token
│   │   ├── auth.js         # Estado de sesión
│   │   └── ui.js           # Toasts, iconos, helpers
│   ├── pages/              # Vistas
│   │   ├── login.js
│   │   ├── register.js
│   │   ├── verify.js
│   │   ├── dashboard.js
│   │   ├── users.js
│   │   ├── endpoints.js
│   │   └── profile.js
│   └── app.js              # Router y shell (sidebar)
├── assets/                 # Imágenes e íconos (reservado)
├── index.html              # Punto de entrada
├── nginx.conf              # Para despliegue con Docker
└── Dockerfile
```

## Uso

```bash
node scripts/serve-frontend.js   # http://localhost:5500
```

O ábrelo directamente con Live Server / XAMPP en el puerto 5500.
El frontend espera el backend en `http://localhost:4000/api` (configurable en `js/core/config.js`).

## Características

- Login/registro con verificación por código.
- Dashboard con métricas y gráficas.
- Gestión de usuarios (solo admin).
- Gestión de endpoints.
- Tema claro/oscuro.
- Exportación CSV.
