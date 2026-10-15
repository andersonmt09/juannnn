# 05 · Diagrama de Clases

El backend sigue el patrón **MVC por capas**. Cada endpoint de la [API](../03-endpoints/endpoints-api.md) recorre las mismas capas:

```mermaid
flowchart LR
    R["Ruta<br/>routes/*.routes.js"] --> MW["Middlewares<br/>auth · validate · rate-limit"]
    MW --> C["Controlador<br/>controllers/*.controller.js"]
    C --> S["Servicio<br/>services/*.service.js"]
    S --> M["Modelo<br/>models/*.model.js"]
    M --> DB[("BD externa")]
    DTO["DTO<br/>dtos/*.dto.js"] -. valida entrada .-> MW
    S -. responde con .-> DTO
```

| Capa | Responsabilidad | Ejemplo |
|---|---|---|
| **Vista** | Interfaz que ve el usuario (frontend) | `frontend/src/views/users/users.view.js` |
| **Ruta** | URL + método HTTP + middlewares | `routes/user.routes.js` |
| **Controlador** | Lee la petición y devuelve la respuesta HTTP | `controllers/user.controller.js` |
| **Servicio** | Reglas de negocio | `services/user.service.js` |
| **Modelo** | Entidad + consultas SQL a su tabla | `models/user.model.js` |
| **DTO** | Valida la entrada y da forma a la salida | `dtos/user.dto.js` |

## Modelos (entidades)

Cada modelo corresponde a una tabla de la [base de datos](../04-base-de-datos/modelo-datos.md).

```mermaid
classDiagram
    direction LR

    class User {
        +id: number
        +name: string
        +email: string
        +passwordHash: string
        +role: "admin|user|inactive"
        +emailVerified: boolean
        +isSample: boolean
        +createdById: number
        +createdDate: Date
        +isActive() boolean
        +isAdmin() boolean
        +findById(id)$ User
        +findByEmail(email)$ User
        +findAll(options)$ object
        +countByRole()$ object
        +create(data)$ User
        +update(id, data)$ User
        +updatePassword(id, hash)$ void
        +markEmailVerified(email)$ void
        +softDelete(id)$ void
    }

    class VerificationCode {
        +id: number
        +userId: number
        +email: string
        +purpose: "login|registration"
        +codeHash: string
        +expiresAt: Date
        +attempts: number
        +used: boolean
        +create(data)$ number
        +findActive(email, purpose)$ VerificationCode
        +incrementAttempts(id)$ void
        +markUsed(id)$ void
        +invalidateAll(email, purpose)$ void
    }

    class Endpoint {
        +id: number
        +name: string
        +path: string
        +method: string
        +description: string
        +findAll()$ Endpoint[]
        +findById(id)$ Endpoint
        +count()$ number
        +create(data)$ Endpoint
        +delete(id)$ void
    }

    class RequestLog {
        +id: number
        +method: string
        +path: string
        +statusCode: number
        +latencyMs: number
        +source: string
        +userId: number
        +create(data)$ void
        +findRecent(limit)$ RequestLog[]
        +getSummary()$ object
    }

    User "1" --> "0..*" VerificationCode : recibe
    User "0..1" --> "0..*" RequestLog : realiza
    User "0..1" --> "0..*" User : crea
```

## Controladores, servicios y DTOs

```mermaid
classDiagram
    direction TB

    class AuthController {
        +register(req, res)
        +verifyRegistration(req, res)
        +login(req, res)
        +verifyLogin(req, res)
        +resendLoginCode(req, res)
        +resendRegistrationCode(req, res)
        +refreshToken(req, res)
    }
    class UserController {
        +list(req, res)
        +getById(req, res)
        +create(req, res)
        +update(req, res)
        +changePassword(req, res)
        +remove(req, res)
    }
    class EndpointController {
        +list(req, res)
        +create(req, res)
        +remove(req, res)
    }
    class MetricController {
        +getDashboard(req, res)
    }

    class AuthService {
        +register(dto)
        +verifyRegistration(dto)
        +login(dto)
        +verifyLogin(dto)
        +resendCode(email, purpose)
        +refreshSession(dto)
    }
    class UserService {
        +list(options)
        +getById(id)
        +create(dto, createdById)
        +update(id, dto)
        +changePassword(id, dto, requester)
        +remove(id, requester)
    }
    class EndpointService {
        +list()
        +create(dto)
        +remove(id)
    }
    class MetricService {
        +getDashboard()
    }
    class VerificationCodeService {
        +issue(userId, email, purpose)
        +verify(email, purpose, code)
        +generateCode() string
    }
    class TokenService {
        +issueTokens(user)
        +verifyAccessToken(token)
        +verifyRefreshToken(token)
    }
    class EmailService {
        +sendVerificationCode(email, code, purpose)
    }

    class BaseDto {
        +validate() string[]
        +assertValid() this
    }
    class LoginDto
    class RegisterDto
    class VerifyCodeDto
    class CreateUserDto
    class UpdateUserDto
    class CreateEndpointDto
    class UserResponseDto

    BaseDto <|-- LoginDto
    BaseDto <|-- RegisterDto
    BaseDto <|-- VerifyCodeDto
    BaseDto <|-- CreateUserDto
    BaseDto <|-- UpdateUserDto
    BaseDto <|-- CreateEndpointDto

    AuthController --> AuthService
    UserController --> UserService
    EndpointController --> EndpointService
    MetricController --> MetricService

    AuthService --> VerificationCodeService
    AuthService --> TokenService
    AuthService --> User
    AuthService ..> UserResponseDto
    VerificationCodeService --> VerificationCode
    VerificationCodeService --> EmailService
    UserService --> User
    UserService ..> UserResponseDto
    EndpointService --> Endpoint
    MetricService --> User
    MetricService --> Endpoint
    MetricService --> RequestLog
```

> Nota: en el código los controladores y servicios son módulos de funciones (CommonJS). Se representan como clases porque cada archivo agrupa las operaciones de un mismo recurso.
