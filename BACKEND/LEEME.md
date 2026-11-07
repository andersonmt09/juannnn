# Cómo correr el backend

```powershell
cd BACKEND
npm install
copy .env.example .env      # y llenar DATABASE_API_URL, DATABASE_API_KEY, JWT_SECRET, JWT_REFRESH_SECRET
npm start
```

- Abre http://localhost:4000 (el backend también sirve el FRONTEND).
- La base de datos es externa: el backend la usa por HTTP (`DATABASE_API_URL`), sin SQL en el código.
- Primer administrador: `npm run crear-admin -- "Nombre" admin@correo.com "Contraseña"`
- Pruebas: `npm test` (58 unitarias y 17 de integración).

## Estructura
- `main.js`         -> arranca el servidor y registra todos los controladores.
- `config/`         -> configuración: variables de entorno, conexión a la base, tokens, correo,
                       sesión y permisos, validación, errores y registro de peticiones.
- `controladores/`  -> solo los endpoints (get/post/put/patch/delete) de cada módulo. Cada archivo expone `prefijo` y `router`.
- `rutas/`          -> lógica de negocio que usan los endpoints.
- `modelos/`        -> un archivo por tabla (19); `modelos/index.js` los registra todos.
- `esquemas/`       -> DTO de petición, DTO de respuesta y las funciones (req, res) de cada endpoint, agrupados por tema (`DTOs_*.js`).
- `pruebas/`        -> pruebas unitarias y de integración.
