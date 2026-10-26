// DTOs de petición de /api/users: limpian y validan body, parámetros (:id) y query (?page=&limit=).
const BaseDto = require("./base");
const { isValidEmail, normalizeEmail, isPositiveInteger } = require("../../utilidades/validaciones");
const { ROLES } = require("../../constantes/roles");
const { SECURITY, PAGINATION } = require("../../constantes/seguridad");

const toRole = (value) => (value === ROLES.ADMIN ? ROLES.ADMIN : ROLES.USER);
const ID_ERROR = "El id debe ser un número entero positivo";
const NAME_ERROR = "El nombre debe tener al menos 2 caracteres";
const EMAIL_ERROR = "El correo electrónico no es válido";
const PASSWORD_ERROR = `La contraseña debe tener al menos ${SECURITY.PASSWORD_MIN_LENGTH} caracteres`;

// GET /api/users?page=&limit=
class ListUsersRequestDto extends BaseDto {
  constructor({ page, limit } = {}) {
    super();
    this.page = Math.max(1, Number(page) || 1);
    this.limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1, Number(limit) || PAGINATION.DEFAULT_LIMIT));
  }
}

// POST /api/users
class CreateUserRequestDto extends BaseDto {
  constructor({ name, email, password, role } = {}) {
    super();
    this.name = String(name || "").trim();
    this.email = normalizeEmail(email);
    this.password = password || "";
    this.role = toRole(role);
  }
  validate() {
    const errors = [];
    if (this.name.length < 2) errors.push(NAME_ERROR);
    if (!isValidEmail(this.email)) errors.push(EMAIL_ERROR);
    if (this.password.length < SECURITY.PASSWORD_MIN_LENGTH) errors.push(PASSWORD_ERROR);
    return errors;
  }
}

// PUT /api/users/:id — solo cambia los campos enviados.
class UpdateUserRequestDto extends BaseDto {
  constructor({ id, name, email, role } = {}) {
    super();
    this.id = Number(id);
    this.name = name !== undefined ? String(name).trim() : undefined;
    this.email = email !== undefined ? normalizeEmail(email) : undefined;
    this.role = role !== undefined ? toRole(role) : undefined;
  }
  validate() {
    const errors = [];
    if (!isPositiveInteger(this.id)) errors.push(ID_ERROR);
    if (this.name !== undefined && this.name.length < 2) errors.push(NAME_ERROR);
    if (this.email !== undefined && !isValidEmail(this.email)) errors.push(EMAIL_ERROR);
    return errors;
  }
  changes() {
    return { name: this.name, email: this.email, role: this.role };
  }
}

// PATCH /api/users/:id/password — currentPassword es obligatoria cuando el usuario cambia la suya.
class ChangePasswordRequestDto extends BaseDto {
  constructor({ id, currentPassword, password } = {}) {
    super();
    this.id = Number(id);
    this.currentPassword = currentPassword || "";
    this.password = password || "";
  }
  validate() {
    const errors = [];
    if (!isPositiveInteger(this.id)) errors.push(ID_ERROR);
    if (this.password.length < SECURITY.PASSWORD_MIN_LENGTH) errors.push(PASSWORD_ERROR);
    return errors;
  }
}

// DELETE /api/users/:id
class UserIdRequestDto extends BaseDto {
  constructor({ id } = {}) {
    super();
    this.id = Number(id);
  }
  validate() {
    return isPositiveInteger(this.id) ? [] : [ID_ERROR];
  }
}

module.exports = {
  ListUsersRequestDto,
  CreateUserRequestDto,
  UpdateUserRequestDto,
  ChangePasswordRequestDto,
  UserIdRequestDto,
};
