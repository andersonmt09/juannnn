# 01 · Requerimientos No Funcionales (RNF)

Cada RNF indica **dónde se cumple en el código**, para que pueda verificarse.

| Código | Categoría | Descripción | Dónde se cumple |
|---|---|---|---|
| RNF-01 | Seguridad | Las contraseñas y los códigos de verificación se guardan cifrados con bcrypt; nunca en texto plano. | `backend/src/services/auth.service.js`, `verification-code.service.js`, `constants/security.js` |
| RNF-02 | Seguridad | Autenticación con JWT: token de acceso (8 h) y refresh token (7 días). Las rutas privadas exigen el token. | `services/token.service.js`, `middlewares/auth.middleware.js` |
| RNF-03 | Seguridad | Máximo 5 intentos fallidos de autenticación por IP cada 15 minutos (respuesta 429). | `middlewares/rate-limit.middleware.js` |
| RNF-04 | Seguridad | Los códigos de verificación tienen 6 dígitos, expiran en 5 minutos, admiten 5 intentos y son de un solo uso. | `constants/security.js`, `services/verification-code.service.js` |
| RNF-05 | Seguridad | Control de acceso por roles: solo `admin` crea, edita o elimina usuarios y endpoints. | `middlewares/auth.middleware.js` (`authorize`), `routes/*.routes.js` |
| RNF-06 | Seguridad | La base de datos es **externa** al sistema. Las credenciales viven solo en `backend/.env`, que no se sube al repositorio. El frontend nunca accede a la base de datos: todo pasa por la API. | `config/environment.js`, `config/database.js`, `.gitignore` |
| RNF-07 | Seguridad | Cabeceras HTTP seguras (Helmet) y CORS limitado al origen del frontend. | `backend/src/app.js` |
| RNF-08 | Seguridad | Toda entrada se valida con DTOs antes de llegar a la lógica de negocio; las respuestas nunca incluyen el hash de la contraseña. | `dtos/*.dto.js`, `middlewares/validate.middleware.js` |
| RNF-09 | Integridad | Eliminación lógica de usuarios (se conserva el historial). | `models/user.model.js` (`softDelete`) |
| RNF-10 | Mantenibilidad | Arquitectura MVC por capas: Rutas → Controladores → Servicios → Modelos. Cada capa en su carpeta y cada archivo con el sufijo de su capa. | `backend/src/` |
| RNF-11 | Mantenibilidad | Respuestas JSON uniformes `{ ok, data \| message }` y manejo centralizado de errores. | `middlewares/error.middleware.js`, `utils/http-error.js` |
| RNF-12 | Rendimiento | Pool de conexiones a la base de datos (10 conexiones). El registro de peticiones no bloquea la respuesta. | `config/database.js`, `middlewares/request-logger.middleware.js` |
| RNF-13 | Usabilidad | Interfaz responsive (computador y celular), tema claro/oscuro persistente, mensajes de confirmación y error. | `frontend/assets/css/styles.css`, `components/layout.component.js`, `utils/toast.js` |
| RNF-14 | Portabilidad | Backend en Node.js 18+ y frontend en HTML/CSS/JS sin frameworks; corre en Windows, Linux y macOS. | `package.json` |
| RNF-15 | Calidad | Pruebas unitarias (DTOs y utilidades) y de integración (API). | `backend/tests/` |
