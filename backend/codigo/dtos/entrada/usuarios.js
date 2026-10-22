// DTOs de entrada para /api/users: limpian y validan lo que envía el cliente.
const BaseDto = require("./base");
const { isValidEmail, normalizeEmail } = require("../../utilidades/validaciones");
const { ROLES } = require("../../constantes/roles");
const { SECURITY } = require("../../constantes/seguridad");

const toRole = (value) => (value === ROLES.ADMIN ? ROLES.ADMIN : ROLES.USER);

class CreateUserDto extends BaseDto {
  constructor({ name, email, password, role } = {}) {
    super();
    this.name = String(name || "").trim();
    this.email = normalizeEmail(email);
    this.password = password || "";
    this.role = toRole(role);
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

class UpdateUserDto extends BaseDto {
  constructor({ name, email, role } = {}) {
    super();
    this.name = name !== undefined ? String(name).trim() : undefined;
    this.email = email !== undefined ? normalizeEmail(email) : undefined;
    this.role = role !== undefined ? toRole(role) : undefined;
  }
  validate() {
    const errors = [];
    if (this.name !== undefined && this.name.length < 2) errors.push("El nombre debe tener al menos 2 caracteres");
    if (this.email !== undefined && !isValidEmail(this.email)) errors.push("El correo electrónico no es válido");
    return errors;
  }
}

class ChangePasswordDto extends BaseDto {
  constructor({ password } = {}) {
    super();
    this.password = password || "";
  }
  validate() {
    return this.password.length >= SECURITY.PASSWORD_MIN_LENGTH
      ? []
      : [`La contraseña debe tener al menos ${SECURITY.PASSWORD_MIN_LENGTH} caracteres`];
  }
}

module.exports = { CreateUserDto, UpdateUserDto, ChangePasswordDto };
