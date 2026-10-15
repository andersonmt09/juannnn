/** DTOs de autenticación (entrada de /api/auth). */
const BaseDto = require("./base.dto");
const { isValidEmail, normalizeEmail } = require("../utils/validators");
const { SECURITY } = require("../constants/security");

class LoginDto extends BaseDto {
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

class RegisterDto extends BaseDto {
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

class VerifyCodeDto extends BaseDto {
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

class EmailDto extends BaseDto {
  constructor({ email } = {}) {
    super();
    this.email = normalizeEmail(email);
  }
  validate() {
    return isValidEmail(this.email) ? [] : ["El correo electrónico no es válido"];
  }
}

class RefreshTokenDto extends BaseDto {
  constructor({ refreshToken } = {}) {
    super();
    this.refreshToken = refreshToken || "";
  }
  validate() {
    return this.refreshToken ? [] : ["El refresh token es obligatorio"];
  }
}

module.exports = { LoginDto, RegisterDto, VerifyCodeDto, EmailDto, RefreshTokenDto };
