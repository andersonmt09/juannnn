// DTOs de petición de /api/auth: limpian y validan lo que envía el cliente.
const BaseDto = require("./base");
const { isValidEmail, normalizeEmail } = require("../../utilidades/validaciones");
const { SECURITY } = require("../../constantes/seguridad");

// POST /api/auth/register
class RegisterRequestDto extends BaseDto {
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
class LoginRequestDto extends BaseDto {
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
class VerifyCodeRequestDto extends BaseDto {
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
class ResendCodeRequestDto extends BaseDto {
  constructor({ email } = {}) {
    super();
    this.email = normalizeEmail(email);
  }
  validate() {
    return isValidEmail(this.email) ? [] : ["El correo electrónico no es válido"];
  }
}

// POST /api/auth/refresh-token
class RefreshTokenRequestDto extends BaseDto {
  constructor({ refreshToken } = {}) {
    super();
    this.refreshToken = refreshToken || "";
  }
  validate() {
    return this.refreshToken ? [] : ["El refresh token es obligatorio"];
  }
}

module.exports = {
  RegisterRequestDto,
  LoginRequestDto,
  VerifyCodeRequestDto,
  ResendCodeRequestDto,
  RefreshTokenRequestDto,
};
