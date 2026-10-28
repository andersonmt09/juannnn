// DTO de petición del frontend: arman (y limpian con trim) el cuerpo o los parámetros de cada
// petición. Tienen los mismos nombres que los DTO de backend/vistas. No validan: valida el backend.
const clean = (value) => (typeof value === "string" ? value.trim() : value);

// Base de las peticiones GET: toQuery() devuelve "?a=1&b=2" sin los campos vacíos.
class QueryRequestDto {
  toQuery() {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(this)) {
      if (value !== undefined && value !== null && value !== "") query.set(key, value);
    }
    const text = query.toString();
    return text ? `?${text}` : "";
  }
}

// ---------- Autenticación ----------

export class RegisterRequestDto {
  constructor({ name, email, password }) {
    this.name = clean(name);
    this.email = clean(email);
    this.password = password;
  }
}

export class CredentialsRequestDto {
  constructor({ email, password }) {
    this.email = clean(email);
    this.password = password;
  }
}

export class VerifyCodeRequestDto {
  constructor({ email, code }) {
    this.email = clean(email);
    this.code = clean(code);
  }
}

export class ResendCodeRequestDto {
  constructor({ email }) {
    this.email = clean(email);
  }
}

export class ForgotPasswordRequestDto {
  constructor({ email }) {
    this.email = clean(email);
  }
}

export class ResetPasswordRequestDto {
  constructor({ email, code, password }) {
    this.email = clean(email);
    this.code = clean(code);
    this.password = password;
  }
}

export class RefreshTokenRequestDto {
  constructor({ refreshToken }) {
    this.refreshToken = refreshToken;
  }
}

// ---------- Usuarios ----------

export class ListUsersRequestDto extends QueryRequestDto {
  constructor({ page = 1, limit = 20 } = {}) {
    super();
    this.page = page;
    this.limit = limit;
  }
}

export class CreateUserRequestDto {
  constructor({ name, email, role, password }) {
    this.name = clean(name);
    this.email = clean(email);
    this.role = role;
    this.password = password;
  }
}

// role undefined = no se envía (el rol propio no se cambia).
export class UpdateUserRequestDto {
  constructor({ name, email, role }) {
    this.name = clean(name);
    this.email = clean(email);
    if (role !== undefined) this.role = role;
  }
}

// currentPassword solo se envía al cambiar la contraseña propia.
export class ChangePasswordRequestDto {
  constructor({ password, currentPassword }) {
    this.password = password;
    if (currentPassword !== undefined) this.currentPassword = currentPassword;
  }
}

// ---------- Monitoreo ----------

export class CreateMonitoredEndpointRequestDto {
  constructor({ method, path, name, description }) {
    this.method = clean(method);
    this.path = clean(path);
    this.name = clean(name);
    this.description = clean(description);
  }
}

// ---------- Métricas ----------

export class ListRequestLogsRequestDto extends QueryRequestDto {
  constructor({ page = 1, limit = 20, method, statusClass } = {}) {
    super();
    this.page = page;
    this.limit = limit;
    this.method = method;
    this.statusClass = statusClass;
  }
}

// ---------- Simulación ----------

export class RunSimulationRequestDto {
  constructor({ operation = "users", forceError = false } = {}) {
    this.operation = operation;
    this.forceError = forceError;
  }
}
