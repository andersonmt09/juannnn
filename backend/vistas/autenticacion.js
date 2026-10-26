// Vista de /api/auth: lo que entra (DTOs de petición) y lo que sale (DTOs de respuesta).
const { BaseRequestDto } = require("./comunes");
const { UserDto } = require("./usuarios");
const { SECURITY, isValidEmail, normalizeEmail } = require("../configuracion");

// ---------- Petición (req) ----------

// POST /api/auth/register
class RegisterRequestDto extends BaseRequestDto {
  constructor({ name, email, password } = {}) {
    super();
    this.name = String(name || "").trim();
    this.email = normalizeEmail(email);
    this.password = password || "";
  }
  validate() {
    const errors = [];
    if (this.name.length < 2) errors.push("El nombre debe tener al menos 2 caracteres");
    if (!isValidEmail(this.email)) errors.push("El correo electrónico no es válido");
    if (this.password.length < SECURITY.PASSWORD_MIN_LENGTH) {
      errors.push(`La contraseña debe tener al menos ${SECURITY.PASSWORD_MIN_LENGTH} caracteres`);
    }
    return errors;
  }
}

// POST /api/auth/login
class LoginRequestDto extends BaseRequestDto {
  constructor({ email, password } = {}) {
    super();
    this.email = normalizeEmail(email);
    this.password = password || "";
  }
  validate() {
    const errors = [];
    if (!isValidEmail(this.email)) errors.push("El correo electrónico no es válido");
    if (!this.password) errors.push("La contraseña es obligatoria");
    return errors;
  }
}

// POST /api/auth/register/verify y POST /api/auth/login/verify
class VerifyCodeRequestDto extends BaseRequestDto {
  constructor({ email, code } = {}) {
    super();
    this.email = normalizeEmail(email);
    this.code = String(code || "").trim();
  }
  validate() {
    const errors = [];
    if (!isValidEmail(this.email)) errors.push("El correo electrónico no es válido");
    if (!/^\d{6}$/.test(this.code)) errors.push("El código debe tener 6 dígitos");
    return errors;
  }
}

// POST /api/auth/register/resend-code y POST /api/auth/login/resend-code
class ResendCodeRequestDto extends BaseRequestDto {
  constructor({ email } = {}) {
    super();
    this.email = normalizeEmail(email);
  }
  validate() {
    return isValidEmail(this.email) ? [] : ["El correo electrónico no es válido"];
  }
}

// POST /api/auth/refresh-token
class RefreshTokenRequestDto extends BaseRequestDto {
  constructor({ refreshToken } = {}) {
    super();
    this.refreshToken = refreshToken || "";
  }
  validate() {
    return this.refreshToken ? [] : ["El refresh token es obligatorio"];
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

// POST /api/auth/login/verify y POST /api/auth/refresh-token
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
  LoginRequestDto,
  VerifyCodeRequestDto,
  ResendCodeRequestDto,
  RefreshTokenRequestDto,
  VerificationRequiredResponseDto,
  EmailVerifiedResponseDto,
  SessionResponseDto,
};
