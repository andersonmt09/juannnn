// DTO de petición (req) de /api/users: lo que envía el cliente, limpio y validado.
const { BaseRequestDto, cleanText, nameErrors, emailErrors, passwordErrors } = require("./comunes");
const { ROLES, PAGINATION, normalizeEmail, isPositiveInteger } = require("../configuracion");
const userService = require("../servicios/usuarios");
const { MessageResponseDto } = require("../vistas/comunes");
const { UserResponseDto, UserListResponseDto } = require("../vistas/usuarios");
const { SessionResponseDto } = require("../vistas/autenticacion");

const ID_ERROR = "El id debe ser un número entero positivo";
const ROLE_ERROR = "El rol debe ser admin o user";
// Solo se pueden asignar estos roles (inactive lo pone el sistema al eliminar).
const isAssignableRole = (value) => value === ROLES.ADMIN || value === ROLES.USER;

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

// ---------- Funciones que reciben la petición (req) ----------

async function list(req, res) {
  res.json(new UserListResponseDto(await userService.list(req.dto)));
}

async function getById(req, res) {
  res.json(new UserResponseDto(await userService.getById(req.dto.id, req.user)));
}

async function create(req, res) {
  res.status(201).json(new UserResponseDto(await userService.create(req.dto, req.user)));
}

async function update(req, res) {
  res.json(new UserResponseDto(await userService.update(req.dto.id, req.dto.changes(), req.user)));
}

async function changePassword(req, res) {
  const session = await userService.changePassword(req.dto.id, req.dto, req.user);
  // Propia: sesión nueva (las demás quedan cerradas). De otro usuario: solo mensaje.
  res.json(session ? new SessionResponseDto(session) : new MessageResponseDto("Contraseña actualizada"));
}

async function remove(req, res) {
  await userService.remove(req.dto.id, req.user);
  res.json(new MessageResponseDto("Usuario eliminado"));
}

module.exports = { ListUsersRequestDto, CreateUserRequestDto, UpdateUserRequestDto, ChangePasswordRequestDto, UserIdRequestDto, list, getById, create, update, changePassword, remove };
