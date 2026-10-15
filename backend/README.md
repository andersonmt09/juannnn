# Backend — API REST

Node.js + Express con patrón **MVC por capas**.

```
Petición → routes/ → middlewares/ → controllers/ → services/ → models/ → BD externa
```

| Carpeta | Responsabilidad | Regla |
|---|---|---|
| `config/` | Variables de entorno y conexión a la BD | Único lugar que lee `.env` |
| `constants/` | Roles y parámetros de seguridad | Sin lógica |
| `routes/` | URL, método HTTP y middlewares de cada endpoint | `index.js` reúne todo bajo `/api` |
| `middlewares/` | Autenticación, roles, validación, límite de intentos, registro de peticiones, errores | — |
| `controllers/` | Leen `req`, llaman al servicio y responden | No contienen reglas de negocio |
| `services/` | Reglas de negocio | No conocen `req` ni `res` |
| `models/` | Entidades y consultas SQL | Únicos que usan la BD |
| `dtos/` | Validación de entrada y forma de la salida | — |
| `utils/` | `HttpError`, `asyncHandler`, validadores | — |

## Comandos

| Comando | Qué hace |
|---|---|
| `npm install` | Instala dependencias |
| `npm start` | Inicia la API en http://localhost:4000/api |
| `npm run dev` | Inicia y reinicia al guardar cambios |
| `npm run create-admin -- "Nombre" correo "Clave"` | Crea el primer administrador |
| `npm test` | Pruebas unitarias (sin BD) |
| `npm run test:integration` | Pruebas contra la API encendida |

Configuración: copiar `.env.example` a `.env`. Endpoints: [docs/03-endpoints](../docs/03-endpoints/endpoints-api.md).
