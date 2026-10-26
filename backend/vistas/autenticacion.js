// Vista de /api/auth: lo que entra (DTOs de petición) y lo que sale (DTOs de respuesta).
const { BaseRequestDto, cleanText, nameErrors, emailErrors, passwordErrors, codeErrors } = require("./comunes");
const { UserDto } = require("./usuarios");
const { normalizeEmail } = require("../configuracion");

// ---------- Petición (req) ----------

// POST /api/auth/register
class RegisterRequestDto extends BaseRequestDto {
  constructor({ name, email, password } = {}) {
    super();
    this.name = cleanText(name);
    this.email = normalizeEmail(email);
    this.password = password;
  }
  validate() {
    return [...nameErrors(this.name), ...emailErrors(this.email), ...passwordErrors(this.password)];
  }
}

// POST /api/auth/login
// Lifeline "UsuarioDTO" del diagrama de secuencia: recibe usu y contra desde la Vista.
class CredentialsRequestDto extends BaseRequestDto {
  constructor({ email, password } = {}) {
    super();
    this.email = normalizeEmail(email);
    this.password = password;
  }
  validate() {
    const errors = emailErrors(this.email);
    if (typeof this.password !== "string") errors.push("La contraseña debe ser texto");
    else if (!this.password) errors.push("La contraseña es obligatoria");
    else if (this.password.length > 1000) errors.push("La contraseña es demasiado larga");
    return errors;
  }
}

// POST /api/auth/password/forgot
class ForgotPasswordRequestDto extends BaseRequestDto {
  constructor({ email } = {}) {
    super();
    this.email = normalizeEmail(email);
  }
  validate() {
    return emailErrors(this.email);
  }
}

// POST /api/auth/password/reset
class ResetPasswordRequestDto extends BaseRequestDto {
  constructor({ email, code, password } = {}) {
    super();
    this.email = normalizeEmail(email);
    this.code = cleanText(code);
    this.password = password;
  }
  validate() {
    return [...emailErrors(this.email), ...codeErrors(this.code), ...passwordErrors(this.password)];
  }
}

// POST /api/auth/register/verify y POST /api/auth/login/verify
class VerifyCodeRequestDto extends BaseRequestDto {
  constructor({ email, code } = {}) {
    super();
    this.email = normalizeEmail(email);
    this.code = cleanText(code);
  }
  validate() {
    return [...emailErrors(this.email), ...codeErrors(this.code)];
  }
}

// POST /api/auth/register/resend-code y POST /api/auth/login/resend-code
class ResendCodeRequestDto extends BaseRequestDto {
  constructor({ email } = {}) {
    super();
    this.email = normalizeEmail(email);
  }
  validate() {
    return emailErrors(this.email);
  }
}

// POST /api/auth/refresh-token
class RefreshTokenRequestDto extends BaseRequestDto {
  constructor({ refreshToken } = {}) {
    super();
    this.refreshToken = refreshToken;
  }
  validate() {
    return typeof this.refreshToken === "string" && this.refreshToken ? [] : ["El refresh token es obligatorio"];
  }
}

// ---------- Respuesta (res) ----------

// POST /api/auth/register y POST /api/auth/login → falta verificar el código enviado al correo.
class VerificationRequiredResponseDto {
  constructor({ email }) {
    this.ok = true;
    this.requiresVerification = true;
    this.email = email;
  }
}

// POST /api/auth/register/verify
class EmailVerifiedResponseDto {
  constructor() {
    this.ok = true;
    this.verified = true;
  }
}

// POST /api/auth/login/verify, POST /api/auth/refresh-token y PATCH /api/users/:id/password (propia)
class SessionResponseDto {
  constructor({ accessToken, refreshToken, user }) {
    this.ok = true;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.user = new UserDto(user);
  }
}

module.exports = {
  RegisterRequestDto,
  CredentialsRequestDto,
  ForgotPasswordRequestDto,
  ResetPasswordRequestDto,
  VerifyCodeRequestDto,
  ResendCodeRequestDto,
  RefreshTokenRequestDto,
  VerificationRequiredResponseDto,
  EmailVerifiedResponseDto,
  SessionResponseDto,
};
