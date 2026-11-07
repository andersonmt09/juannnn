// DTO de usuarios e inicio de sesión
const { BaseRequestDto, cleanText, codeErrors, emailErrors, nameErrors, passwordErrors } = require("./DTOs_Comunes");
const { PAGINATION, ROLES, isPositiveInteger, normalizeEmail } = require("../config/configuracion");

// ---------- Petición (validan y limpian lo que llega)

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

class ResendCodeRequestDto extends BaseRequestDto {
  constructor({ email } = {}) {
    super();
    this.email = normalizeEmail(email);
  }
  validate() {
    return emailErrors(this.email);
  }
}

class RefreshTokenRequestDto extends BaseRequestDto {
  constructor({ refreshToken } = {}) {
    super();
    this.refreshToken = refreshToken;
  }
  validate() {
    return typeof this.refreshToken === "string" && this.refreshToken ? [] : ["El refresh token es obligatorio"];
  }
}

const ID_ERROR = "El id debe ser un número entero positivo";
const ROLE_ERROR = "El rol debe ser admin o user";
// solo estos roles (inactive lo pone el sistema)
const isAssignableRole = (value) => value === ROLES.ADMIN || value === ROLES.USER;

class ListUsersRequestDto extends BaseRequestDto {
  constructor({ page, limit } = {}) {
    super();
    this.page = Math.max(1, Number(page) || 1);
    this.limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1, Number(limit) || PAGINATION.DEFAULT_LIMIT));
  }
}

class CreateUserRequestDto extends BaseRequestDto {
  constructor({ name, email, password, role } = {}) {
    super();
    this.name = cleanText(name);
    this.email = normalizeEmail(email);
    this.password = password;
    this.role = role === undefined || role === null ? ROLES.USER : role;
  }
  validate() {
    const errors = [...nameErrors(this.name), ...emailErrors(this.email), ...passwordErrors(this.password)];
    if (!isAssignableRole(this.role)) errors.push(ROLE_ERROR);
    return errors;
  }
}

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

// currentPassword es obligatoria al cambiar la propia
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

class UserIdRequestDto extends BaseRequestDto {
  constructor({ id } = {}) {
    super();
    this.id = Number(id);
  }
  validate() {
    return isPositiveInteger(this.id) ? [] : [ID_ERROR];
  }
}

// ---------- Respuesta (lo que se devuelve)

// ninguna expone el hash de la contraseña

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

class UserResponseDto {
  constructor(user) {
    this.ok = true;
    this.data = new UserDto(user);
  }
}

class UserListResponseDto {
  constructor({ users, total, page, limit }) {
    this.ok = true;
    this.data = users.map((user) => new UserDto(user));
    this.meta = { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }
}

class VerificationRequiredResponseDto {
  constructor({ email }) {
    this.ok = true;
    this.requiresVerification = true;
    this.email = email;
  }
}

class EmailVerifiedResponseDto {
  constructor() {
    this.ok = true;
    this.verified = true;
  }
}

class SessionResponseDto {
  constructor({ accessToken, refreshToken, user }) {
    this.ok = true;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.user = new UserDto(user);
  }
}

// se exportan antes de cargar rutas/: las rutas también usan estos DTO
module.exports = {
  RegisterRequestDto,
  CredentialsRequestDto,
  VerifyCodeRequestDto,
  ResendCodeRequestDto,
  RefreshTokenRequestDto,
  ListUsersRequestDto,
  CreateUserRequestDto,
  UpdateUserRequestDto,
  ChangePasswordRequestDto,
  UserIdRequestDto,
  UserDto,
  UserResponseDto,
  UserListResponseDto,
  VerificationRequiredResponseDto,
  EmailVerifiedResponseDto,
  SessionResponseDto,
};

// ---------- Funciones de los endpoints (reciben req, llaman a rutas/ y responden con un DTO)

const authService = require("../rutas/autenticacion");
const userService = require("../rutas/usuarios");
const { clientInfo, CODE_PURPOSE } = require("../config/configuracion");
const { MessageResponseDto } = require("./DTOs_Comunes");

// autenticacion
async function register(req, res) {
  const result = await authService.register(req.dto);
  res.status(201).json(new VerificationRequiredResponseDto(result));
}

async function verifyRegistration(req, res) {
  await authService.verifyRegistration(req.dto);
  res.json(new EmailVerifiedResponseDto());
}

async function login(req, res) {
  const user = await authService.validateCredentials(req.dto, clientInfo(req));
  res.json(new VerificationRequiredResponseDto(await authService.startLoginVerification(user)));
}

async function verifyLogin(req, res) {
  res.json(new SessionResponseDto(await authService.verifyLogin(req.dto, clientInfo(req))));
}

async function resendLoginCode(req, res) {
  await authService.resendCode({ email: req.dto.email, purpose: CODE_PURPOSE.LOGIN });
  res.json(new MessageResponseDto("Código reenviado"));
}

async function resendRegistrationCode(req, res) {
  await authService.resendCode({ email: req.dto.email, purpose: CODE_PURPOSE.REGISTRATION });
  res.json(new MessageResponseDto("Código reenviado"));
}

async function refreshToken(req, res) {
  res.json(new SessionResponseDto(await authService.refreshSession(req.dto, clientInfo(req))));
}

// usuarios
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
  const session = await userService.changePassword(req.dto.id, req.dto, req.user, clientInfo(req));
  // propia: sesión nueva, las demás se cierran
  res.json(session ? new SessionResponseDto(session) : new MessageResponseDto("Contraseña actualizada"));
}

async function remove(req, res) {
  await userService.remove(req.dto.id, req.user);
  res.json(new MessageResponseDto("Usuario eliminado"));
}

Object.assign(module.exports, {
  register,
  verifyRegistration,
  login,
  verifyLogin,
  resendLoginCode,
  resendRegistrationCode,
  refreshToken,
  list,
  getById,
  create,
  update,
  changePassword,
  remove,
});
