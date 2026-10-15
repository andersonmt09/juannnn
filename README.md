# AXON Stack Flow - Proyecto Web (Full Stack)

Arquitectura por capas: **Controladores → Servicios → Repositorios → Modelos**, con DTOs, MySQL, JWT + verificación por email, frontend en HTML/CSS/JS puro.

## Estructura (organizada para revisión académica)

```
backend/        API REST (Node.js + Express) - arquitectura por capas
frontend/       Interfaz web (HTML/CSS/JS) - SPA organizada por features
database/       schema.sql
scripts/        Servidor estático del frontend
docs/           Documentación (arquitectura, estructura, instalación, uso)
```

Cada módulo importante tiene su propio `README.md`:
- `backend/README.md` → estructura, env, comandos, endpoints.
- `frontend/README.md` → estructura y uso del frontend.
- `docs/ESTRUCTURA_PROYECTO.md` → árbol completo y responsabilidades.
- `docs/GUIA_USO.md` → cómo usar el sistema paso a paso.

## Requisitos

- Node.js 18+ (https://nodejs.org)
- MySQL 8+ (ver docs/INSTALACION_MYSQL.md)
- (Opcional) SMTP para envío real de emails. Sin SMTP, los códigos se imprimen en la consola del backend.

## Instalación rápida

### 1. Base de datos

Instala MySQL y asegúrate de que esté corriendo en `localhost:3306`. Luego:

```bash
cd backend
copy .env.example .env   # (Windows) o cp .env.example .env
# edita .env si tu MySQL tiene contraseña
npm install
npm run db:init          # crea la BD y las tablas
npm run seed             # crea usuarios demo
```

### 2. Backend

```bash
cd backend
npm start                # http://localhost:4000
```

### 3. Frontend

En otra terminal:

```bash
node scripts/serve-frontend.js   # http://localhost:5500
```

Abre http://localhost:5500 en el navegador.

## Credenciales por defecto (del seed)

| Email | Contraseña | Rol |
|---|---|---|
| admin@axon.com | Admin123! | admin |
| user@axon.com | User123! | user |
| demo@axon.com | Demo123! | user (protegido, no eliminable) |

El flujo de login y registro requiere verificación por código (6 dígitos) enviado por email.
En modo desarrollo (sin SMTP), el código se imprime en la consola del backend.

## Endpoints principales

- `POST /api/auth/login` `{ email, password }`
- `POST /api/auth/verify-code` `{ email, code }`
- `POST /api/auth/register`
- `POST /api/auth/verify-registration`
- `POST /api/auth/resend-code` / `resend-registration`
- `POST /api/auth/refresh-token`
- `GET/POST/PUT/PATCH/DELETE /api/users` (admin para crear/editar/eliminar)
- `GET /api/metrics/dashboard`
- `GET/POST/DELETE /api/axon/endpoints`
- `GET /api/health`

## Despliegue con Docker (opcional)

```bash
docker compose up -d --build
# Frontend: http://localhost:8080
# Backend:  http://localhost:4000
```

## Pruebas

```bash
cd backend
npm test            # 7 pruebas: health, login, rutas protegidas, DTOs
```

Los smoke tests requieren el backend corriendo en `http://localhost:4000`.
Para probar contra otra URL: define `BASE_URL`.

## Notas

- Eliminación de usuarios es lógica (`role = 'inactive'`).
- Usuarios demo (`is_sample = 1`) no se pueden eliminar y no puedes eliminar tu propio usuario.
- Rate limiting: 5 intentos por IP cada 15 minutos.
- Códigos: 6 dígitos, expiran en 5 minutos, 5 intentos por código.
