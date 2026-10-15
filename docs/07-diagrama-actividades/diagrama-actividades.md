# 07 · Diagramas de Actividades

Describen el flujo de trabajo de cada [requerimiento funcional](../01-requerimientos/requerimientos-funcionales.md) desde el punto de vista del usuario y del sistema.

## AD-01 Registro y verificación de correo (RF-01, RF-02, RF-04)

```mermaid
flowchart TD
    I((Inicio)) --> A[Visitante abre Registrarse]
    A --> B[/Ingresa nombre, correo y contraseña/]
    B --> C{¿Datos válidos?}
    C -- No --> C1[Mostrar errores de validación] --> B
    C -- Sí --> D{¿Correo ya registrado?}
    D -- Sí --> D1[Mostrar: El correo ya está registrado] --> B
    D -- No --> E[Crear usuario sin verificar]
    E --> F[Generar código de 6 dígitos y enviarlo al correo]
    F --> G[/Visitante ingresa el código/]
    G --> H{¿Código correcto y vigente?}
    H -- No --> H1{¿Pedir uno nuevo?}
    H1 -- Sí --> F
    H1 -- No --> G
    H -- Sí --> J[Marcar correo como verificado]
    J --> K[Redirigir a Iniciar sesión]
    K --> FIN((Fin))
```

## AD-02 Inicio de sesión en dos pasos (RF-03, RF-04)

```mermaid
flowchart TD
    I((Inicio)) --> A[/Usuario ingresa correo y contraseña/]
    A --> RL{¿Más de 5 intentos fallidos<br/>en 15 min?}
    RL -- Sí --> RL1[Bloquear temporalmente - 429] --> FIN
    RL -- No --> B{¿Credenciales correctas?}
    B -- No --> B1[Mostrar: Credenciales incorrectas] --> A
    B -- Sí --> C{¿Cuenta activa y<br/>correo verificado?}
    C -- No --> C1[Mostrar motivo - 403] --> FIN
    C -- Sí --> D[Invalidar códigos anteriores]
    D --> E[Generar y enviar código al correo]
    E --> F[/Usuario ingresa el código/]
    F --> G{¿Código válido, vigente<br/>y menos de 5 intentos?}
    G -- No --> G1{¿Reenviar código?}
    G1 -- Sí --> D
    G1 -- No --> F
    G -- Sí --> H[Emitir access token y refresh token]
    H --> J[Guardar sesión y mostrar Dashboard]
    J --> FIN((Fin))
```

## AD-03 Gestión de usuarios por el administrador (RF-06, RF-07, RF-08, RF-10)

```mermaid
flowchart TD
    I((Inicio)) --> A{¿Rol admin?}
    A -- No --> A1[Ocultar módulo / responder 403] --> FIN
    A -- Sí --> B[Listar usuarios activos]
    B --> C{¿Qué acción?}
    C -- Crear --> D[/Nombre, correo, rol, contraseña/]
    D --> D1{¿Válido y correo libre?}
    D1 -- No --> D2[Mostrar error] --> D
    D1 -- Sí --> D3[Guardar usuario verificado] --> B
    C -- Editar --> E[/Nuevos datos y contraseña opcional/]
    E --> E1{¿Válido y correo libre?}
    E1 -- No --> E2[Mostrar error] --> E
    E1 -- Sí --> E3[Actualizar usuario] --> B
    C -- Eliminar --> F{¿Es demo o es<br/>él mismo?}
    F -- Sí --> F1[Rechazar eliminación] --> B
    F -- No --> F2{¿Confirma?}
    F2 -- No --> B
    F2 -- Sí --> F3[Cambiar rol a inactive<br/>eliminación lógica] --> B
    C -- Exportar --> G[Descargar CSV] --> B
    C -- Salir --> FIN((Fin))
```

## AD-04 Consulta del dashboard (RF-11, RF-14, RF-15)

```mermaid
flowchart TD
    I((Inicio)) --> A[Usuario abre Dashboard]
    A --> B{¿Token válido?}
    B -- No --> B1{¿Refresh token válido?}
    B1 -- Sí --> B2[Renovar sesión - RF-05] --> C
    B1 -- No --> B3[Cerrar sesión e ir a Login] --> FIN
    B -- Sí --> C[Consultar en paralelo]
    C --> C1[Usuarios por rol]
    C --> C2[Total de endpoints]
    C --> C3[Resumen de request_logs]
    C --> C4[Últimas 10 peticiones]
    C1 & C2 & C3 & C4 --> D[Mostrar tarjetas, gráficas y tabla]
    D --> E{¿Exportar actividad?}
    E -- Sí --> E1[Generar CSV] --> FIN
    E -- No --> FIN((Fin))
```
