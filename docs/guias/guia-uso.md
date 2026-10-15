# Guía de uso

## Crear una cuenta (RF-01, RF-02)

1. En la pantalla de inicio pulsa **Regístrate**.
2. Escribe nombre, correo y una contraseña de al menos 6 caracteres.
3. Revisa tu correo (o la consola del backend en desarrollo) y escribe el código de 6 dígitos.
4. Listo: ya puedes iniciar sesión. El código vence en 5 minutos; si se vence, pulsa **Reenviar código**.

## Iniciar sesión (RF-03)

1. Escribe correo y contraseña.
2. Escribe el código de 6 dígitos que llega al correo.
3. Entras al **Dashboard**.

Tras 5 intentos fallidos desde el mismo equipo hay que esperar 15 minutos.

## Menú

| Opción | Quién la ve | Qué permite |
|---|---|---|
| Dashboard | Todos | Totales, gráficas de peticiones, actividad reciente y exportar CSV |
| Usuarios | Solo administrador | Crear, editar, eliminar usuarios y exportar CSV |
| Endpoints | Todos (crear/eliminar solo admin) | Lista de endpoints monitoreados |
| Mi perfil | Todos | Ver datos y cambiar la contraseña |
| Modo claro / oscuro | Todos | Cambia el tema y lo recuerda |
| Cerrar sesión | Todos | Termina la sesión |

## Reglas importantes

- Eliminar un usuario no lo borra: queda **inactivo** y conserva su historial.
- No puedes eliminar tu propio usuario ni los usuarios demo.
- Los usuarios creados por el administrador quedan verificados y no necesitan código de registro.
