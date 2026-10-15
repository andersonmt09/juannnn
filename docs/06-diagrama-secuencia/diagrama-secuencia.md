# 06 · Diagramas de Secuencia

Muestran cómo colaboran en el tiempo las clases del [diagrama de clases](../05-diagrama-clases/diagrama-clases.md) para atender un caso de uso.

## SD-01 Iniciar sesión en dos pasos (CU-02 · RF-03)

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario
    participant V as login.view / verify.view
    participant R as auth.routes
    participant C as AuthController
    participant S as AuthService
    participant VC as VerificationCodeService
    participant M as User (modelo)
    participant DB as BD externa
    participant E as EmailService

    rect rgba(61,214,198,.08)
    Note over U,E: Paso 1 — credenciales
    U->>V: correo + contraseña
    V->>R: POST /api/auth/login
    R->>R: authRateLimiter + validateBody(LoginDto)
    R->>C: login(req.dto)
    C->>S: login(dto)
    S->>M: findByEmail(email)
    M->>DB: SELECT * FROM users WHERE email = ?
    DB-->>M: fila
    M-->>S: User
    S->>S: bcrypt.compare(password, passwordHash)
    alt credenciales incorrectas
        S-->>C: HttpError 401
        C-->>V: { ok:false, message }
    else cuenta inactiva o sin verificar
        S-->>C: HttpError 403
    else correcto
        S->>VC: issue(userId, email, "login")
        VC->>DB: invalidar anteriores + INSERT código (hash)
        VC->>E: sendVerificationCode(email, código)
        E-->>U: correo con código de 6 dígitos
        S-->>C: { requiresVerification: true }
        C-->>V: 200
        V->>V: ir a #/verify
    end
    end

    rect rgba(244,185,66,.08)
    Note over U,E: Paso 2 — código
    U->>V: código de 6 dígitos
    V->>R: POST /api/auth/login/verify
    R->>C: verifyLogin(req.dto)
    C->>S: verifyLogin(dto)
    S->>VC: verify(email, "login", código)
    VC->>DB: SELECT código activo / attempts+1
    alt vencido, incorrecto o 5 intentos
        VC-->>S: HttpError 401/429
        S-->>V: error
    else válido
        VC->>DB: UPDATE used = 1
        S->>M: findByEmail(email)
        S->>S: TokenService.issueTokens(user)
        S-->>C: { accessToken, refreshToken, user }
        C-->>V: 200
        V->>V: guardar sesión e ir a #/dashboard
    end
    end
```

## SD-02 Registrarse y verificar correo (CU-01 · RF-01, RF-02)

```mermaid
sequenceDiagram
    autonumber
    actor V as Visitante
    participant UI as register.view / verify.view
    participant C as AuthController
    participant S as AuthService
    participant M as User (modelo)
    participant VC as VerificationCodeService
    participant DB as BD externa

    V->>UI: nombre, correo, contraseña
    UI->>C: POST /api/auth/register (RegisterDto)
    C->>S: register(dto)
    S->>M: findByEmail(email)
    alt correo ya existe
        S-->>UI: 409 "El correo ya está registrado"
    else nuevo
        S->>S: bcrypt.hash(password)
        S->>M: create(role = user, email_verified = 0)
        M->>DB: INSERT INTO users
        S->>VC: issue(userId, email, "registration")
        S-->>UI: 201 { requiresVerification }
        V->>UI: código recibido
        UI->>C: POST /api/auth/register/verify
        C->>S: verifyRegistration(dto)
        S->>VC: verify(...)
        S->>M: markEmailVerified(email)
        M->>DB: UPDATE users SET email_verified = 1
        S-->>UI: 200 { verified: true }
        UI->>UI: ir a #/login
    end
```

## SD-03 Crear usuario como administrador (CU-05 · RF-07)

```mermaid
sequenceDiagram
    autonumber
    actor A as Administrador
    participant UI as users.view
    participant HC as http.client
    participant MW as authenticate / authorize
    participant C as UserController
    participant S as UserService
    participant M as User (modelo)
    participant DB as BD externa

    A->>UI: llena formulario "Nuevo usuario"
    UI->>HC: userService.create(datos)
    HC->>MW: POST /api/users + Bearer token
    MW->>MW: verificar JWT y rol admin
    alt sin token o no es admin
        MW-->>UI: 401 / 403
    else autorizado
        MW->>C: create(req.dto: CreateUserDto)
        C->>S: create(dto, adminId)
        S->>M: findByEmail(email)
        alt correo repetido
            S-->>UI: 409
        else
            S->>M: create(..., email_verified = 1, created_by_id = adminId)
            M->>DB: INSERT INTO users
            S-->>C: UserResponseDto (sin contraseña)
            C-->>UI: 201 { data }
            UI->>UI: recargar tabla + mensaje "Usuario creado"
        end
    end
```

## SD-04 Registro automático de peticiones (CU-11 · RF-14)

```mermaid
sequenceDiagram
    participant Cl as Cliente
    participant L as request-logger.middleware
    participant API as Ruta / Controlador
    participant RL as RequestLog (modelo)
    participant DB as BD externa

    Cl->>L: cualquier petición /api/...
    L->>L: guardar hora de inicio
    L->>API: next()
    API-->>Cl: respuesta
    L->>RL: create(método, ruta, estado, latencia, IP, usuario)
    RL->>DB: INSERT INTO request_logs
    Note over L,DB: Se ejecuta después de responder:<br/>no retrasa al usuario (RNF-12)
```
