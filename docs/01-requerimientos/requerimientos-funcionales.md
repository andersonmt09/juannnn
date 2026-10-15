# 01 · Requerimientos Funcionales (RF)

Punto de partida del proyecto. Todo lo demás (casos de uso, endpoints, base de datos y diagramas) se deriva de esta lista. Ver la [matriz de trazabilidad](../08-trazabilidad/matriz-trazabilidad.md).

**Actores:** Visitante (sin cuenta), Usuario (rol `user`), Administrador (rol `admin`), Sistema.

| Código | Nombre | Descripción | Actor | Prioridad |
|---|---|---|---|---|
| RF-01 | Registrar usuario | El visitante crea una cuenta con nombre, correo y contraseña. El sistema envía un código de 6 dígitos al correo. | Visitante | Alta |
| RF-02 | Verificar correo | El visitante confirma su correo con el código recibido. Sin verificación no puede iniciar sesión. | Visitante | Alta |
| RF-03 | Iniciar sesión en dos pasos | El usuario ingresa correo y contraseña (paso 1) y luego el código enviado a su correo (paso 2). Al validarse recibe sus tokens de sesión. | Usuario, Administrador | Alta |
| RF-04 | Reenviar código | El usuario puede pedir un nuevo código de registro o de inicio de sesión; el anterior queda invalidado. | Visitante, Usuario | Media |
| RF-05 | Renovar sesión | El sistema renueva el token de acceso con el refresh token sin pedir de nuevo las credenciales. | Sistema | Media |
| RF-06 | Consultar usuarios | Listar usuarios activos (con paginación) y consultar uno por su id. | Usuario, Administrador | Alta |
| RF-07 | Crear usuario | El administrador crea usuarios y les asigna rol (`admin` o `user`). Quedan verificados. | Administrador | Alta |
| RF-08 | Editar usuario | El administrador modifica nombre, correo o rol de un usuario. | Administrador | Alta |
| RF-09 | Cambiar contraseña | Cada usuario cambia su propia contraseña; el administrador puede cambiar la de cualquiera. | Usuario, Administrador | Media |
| RF-10 | Eliminar usuario | El administrador elimina usuarios de forma lógica (rol `inactive`). No se pueden eliminar usuarios demo ni el propio usuario. | Administrador | Alta |
| RF-11 | Ver dashboard de métricas | Mostrar totales de usuarios, endpoints, peticiones de las últimas 24 h, latencia promedio, gráficas por código y método, y actividad reciente. | Usuario, Administrador | Alta |
| RF-12 | Consultar endpoints | Listar los endpoints registrados para monitoreo. | Usuario, Administrador | Media |
| RF-13 | Gestionar endpoints | El administrador registra (nombre, ruta, método, descripción) y elimina endpoints. | Administrador | Media |
| RF-14 | Registrar peticiones | El sistema guarda automáticamente cada petición a la API: método, ruta, estado, latencia, origen y usuario. | Sistema | Alta |
| RF-15 | Exportar a CSV | Exportar la lista de usuarios y la actividad reciente a archivos CSV. | Usuario, Administrador | Baja |
| RF-16 | Cerrar sesión | El usuario termina su sesión y se eliminan sus tokens del navegador. | Usuario, Administrador | Alta |
| RF-17 | Consultar perfil | El usuario ve su nombre, correo y rol. | Usuario, Administrador | Baja |
