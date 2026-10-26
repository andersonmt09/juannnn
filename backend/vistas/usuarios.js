// Vista de /api/users: lo que entra (DTOs de petición) y lo que sale (DTOs de respuesta).
const { BaseRequestDto, cleanText, nameErrors, emailErrors, passwordErrors } = require("./comunes");
const { ROLES, PAGINATION, normalizeEmail, isPositiveInteger } = require("../configuracion");

const ID_ERROR = "El id debe ser un número entero positivo";
const ROLE_ERROR = "El rol debe ser admin o user";
// Solo se pueden asignar estos roles (inactive lo pone el sistema al eliminar).
const isAssignableRole = (value) => value === ROLES.ADMIN || value === ROLES.USER;

// ---------- Petición (req) ----------

// GET /api/users?page=&limit=
class ListUsersRequestDto extends BaseRequestDto {
  constructor({ page, limit } = {}) {
    super();
    this.page = Math.max(1, Number(page) || 1);
    this.limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1, Number(limit) || PAGINATION.DEFAULT_LIMIT));
  }
}

// POST /api/users
class CreateUserRequestDto extends BaseRequestDto {
  constructor({ name, email, password, role } = {}) {
    super();
    this.name = cleanText(name);
    this.email = normalizeEmail(email);
    this.password = password;
    this.role = role === undefined || role === null ? ROLES.USER : role; // por defecto "user"
  }
  validate() {
    const errors = [...nameErrors(this.name), ...emailErrors(this.email), ...passwordErrors(this.password)];
    if (!isAssignableRole(this.role)) errors.push(ROLE_ERROR);
    return errors;
  }
}

// PUT /api/users/:id — solo cambia los campos enviados.
class UpdateUserRequestDto extends BaseRequestDto {
  constructor({ id, name, email, role } = {}) {
    super();
    this.id = Number(id);
    this.name = cleanText(name);
    this.email = email !== undefined ? normalizeEmail(email) : undefined;
    this.role = role;
  }
  validate() {
    const errors = [];
    if (!isPositiveInteger(this.id)) errors.push(ID_ERROR);
    if (this.name !== undefined) errors.push(...nameErrors(this.name));
    if (this.email !== undefined) errors.push(...emailErrors(this.email));
    if (this.role !== undefined && !isAssignableRole(this.role)) errors.push(ROLE_ERROR);
    return errors;
  }
  changes() {
    return { name: this.name, email: this.email, role: this.role };
  }
}

// PATCH /api/users/:id/password — currentPassword es obligatoria cuando el usuario cambia la suya.
class ChangePasswordRequestDto extends BaseRequestDto {
  constructor({ id, currentPassword, password } = {}) {
    super();
    this.id = Number(id);
    this.currentPassword = currentPassword === undefined ? "" : currentPassword;
    this.password = password;
  }
  validate() {
    const errors = [];
    if (!isPositiveInteger(this.id)) errors.push(ID_ERROR);
    if (typeof this.currentPassword !== "string") errors.push("La contraseña actual debe ser texto");
    errors.push(...passwordErrors(this.password));
    return errors;
  }
}

// DELETE /api/users/:id
class UserIdRequestDto extends BaseRequestDto {
  constructor({ id } = {}) {
    super();
    this.id = Number(id);
  }
  validate() {
    return isPositiveInteger(this.id) ? [] : [ID_ERROR];
  }
}

// ---------- Respuesta (res) ----------
// Ninguna expone el hash de la contraseña.

// Datos públicos de un usuario (también se usa en la respuesta de sesión).
class UserDto {
  constructor(user) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.role = user.role;
    this.emailVerified = user.emailVerified;
    this.createdDate = user.createdDate;
    this.updatedDate = user.updatedDate;
  }
}

// POST /api/users y PUT /api/users/:id → { ok, data }
class UserResponseDto {
  constructor(user) {
    this.ok = true;
    this.data = new UserDto(user);
  }
}

// GET /api/users → { ok, data: [], meta: { total, page, limit, totalPages } }
class UserListResponseDto {
  constructor({ users, total, page, limit }) {
    this.ok = true;
    this.data = users.map((user) => new UserDto(user));
    this.meta = { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }
}

module.exports = {
  ListUsersRequestDto,
  CreateUserRequestDto,
  UpdateUserRequestDto,
  ChangePasswordRequestDto,
  UserIdRequestDto,
  UserDto,
  UserResponseDto,
  UserListResponseDto,
};
