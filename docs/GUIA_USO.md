# Guía de Uso del Sistema

## 1. Requisitos
- Node.js 18+
- MySQL 8+

## 2. Instalar MySQL
Ver `docs/INSTALACION_MYSQL.md`.

## 3. Configurar backend
```bash
cd backend
copy .env.example .env
npm install
npm run db:init
npm run seed
npm start
```
Servidor en `http://localhost:4000`. Credenciales: `admin@axon.com / Admin123!`.

## 4. Iniciar frontend
```bash
node scripts/serve-frontend.js
```
Abrir `http://localhost:5500`.

## 5. Flujos
### Login
1. Ingresa email y contraseña.
2. El backend envía un código de 6 dígitos (consola en dev).
3. Ingrésalo en la pantalla de verificación.
4. Recibes JWT + refresh token; acceso al panel.

### Registro
1. Completa el formulario.
2. Verifica tu correo con el código recibido.
3. Ya puedes iniciar sesión.

### Panel de administración (admin)
- Usuarios: crear, editar, cambiar contraseña, eliminar (lógico).
- Endpoints: CRUD.
- Métricas: dashboard y CSV.

### Exportar
Botones "Exportar CSV" en Dashboard y Usuarios.

## 6. Pruebas
```bash
cd backend
npm test
```

## 7. Docker
```bash
docker compose up -d --build
```
> Nota: cambia los secretos en `docker-compose.yml` para producción.
