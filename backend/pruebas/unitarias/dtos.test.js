// Pruebas de los DTOs de petición y de respuesta (no necesitan base de datos).
const test = require("node:test");
const assert = require("node:assert/strict");
const { LoginRequestDto, RegisterRequestDto, VerifyCodeRequestDto } = require("../../codigo/dtos/peticion/autenticacion");
const {
  ListUsersRequestDto,
  UserIdRequestDto,
  CreateUserRequestDto,
  UpdateUserRequestDto,
  ChangePasswordRequestDto,
} = require("../../codigo/dtos/peticion/usuarios");
const { CreateEndpointRequestDto } = require("../../codigo/dtos/peticion/endpoints");
const { UserDto, UserListResponseDto } = require("../../codigo/dtos/respuesta/usuarios");
const { SessionResponseDto, VerificationRequiredResponseDto } = require("../../codigo/dtos/respuesta/autenticacion");
const { MessageResponseDto, ErrorResponseDto } = require("../../codigo/dtos/respuesta/comunes");
const { HealthResponseDto } = require("../../codigo/dtos/respuesta/salud");

const user = { id: 1, name: "Ana", email: "a@b.com", passwordHash: "secreto", role: "user", emailVerified: true };

// ---------- Petición ----------

test("LoginRequestDto normaliza el correo y exige contraseña", () => {
  const dto = new LoginRequestDto({ email: "  ADMIN@Axon.com ", password: "" });
  assert.equal(dto.email, "admin@axon.com");
  assert.deepEqual(dto.validate(), ["La contraseña es obligatoria"]);
});

test("RegisterRequestDto rechaza nombre corto y contraseña corta", () => {
  const errors = new RegisterRequestDto({ name: "A", email: "a@b.com", password: "123" }).validate();
  assert.equal(errors.length, 2);
});

test("VerifyCodeRequestDto exige exactamente 6 dígitos", () => {
  assert.equal(new VerifyCodeRequestDto({ email: "a@b.com", code: "123456" }).validate().length, 0);
  assert.equal(new VerifyCodeRequestDto({ email: "a@b.com", code: "12a456" }).validate().length, 1);
});

test("assertValid lanza error 400 con la lista de errores", () => {
  assert.throws(
    () => new CreateUserRequestDto({ name: "", email: "x", password: "" }).assertValid(),
    (error) => error.statusCode === 400 && error.details.length === 3
  );
});

test("CreateUserRequestDto solo acepta los roles admin y user", () => {
  assert.equal(new CreateUserRequestDto({ role: "superadmin" }).role, "user");
  assert.equal(new CreateUserRequestDto({ role: "admin" }).role, "admin");
});

test("UpdateUserRequestDto valida el :id e ignora los campos no enviados", () => {
  const dto = new UpdateUserRequestDto({ id: "7", name: "Ana" });
  assert.deepEqual(dto.validate(), []);
  assert.deepEqual(dto.changes(), { name: "Ana", email: undefined, role: undefined });
  assert.equal(new UpdateUserRequestDto({ id: "abc", name: "Ana" }).validate().length, 1);
});

test("UserIdRequestDto y ChangePasswordRequestDto rechazan ids inválidos", () => {
  assert.equal(new UserIdRequestDto({ id: "0" }).validate().length, 1);
  assert.equal(new ChangePasswordRequestDto({ id: "x", password: "123" }).validate().length, 2);
});

test("ListUsersRequestDto convierte y limita page y limit", () => {
  const dto = new ListUsersRequestDto({ page: "0", limit: "999", all: "true" });
  assert.deepEqual({ page: dto.page, limit: dto.limit, includeInactive: dto.includeInactive }, { page: 1, limit: 200, includeInactive: true });
});

test("CreateEndpointRequestDto valida ruta y método HTTP", () => {
  assert.equal(new CreateEndpointRequestDto({ name: "X", path: "/api/x", method: "get" }).validate().length, 0);
  assert.equal(new CreateEndpointRequestDto({ name: "X", path: "api", method: "FETCH" }).validate().length, 2);
});

// ---------- Respuesta ----------

test("UserDto nunca expone el hash de la contraseña", () => {
  assert.equal("passwordHash" in new UserDto(user), false);
});

test("SessionResponseDto entrega tokens y usuario público", () => {
  const dto = new SessionResponseDto({ accessToken: "a", refreshToken: "r", user });
  assert.equal(dto.ok, true);
  assert.equal("passwordHash" in dto.user, false);
});

test("UserListResponseDto arma data y meta", () => {
  const dto = new UserListResponseDto({ users: [user], total: 1, page: 1, limit: 50 });
  assert.deepEqual(dto.meta, { total: 1, page: 1, limit: 50 });
  assert.equal(dto.data.length, 1);
});

test("Respuestas comunes y de estado tienen el formato esperado", () => {
  assert.deepEqual({ ...new VerificationRequiredResponseDto({ email: "a@b.com" }) }, { ok: true, requiresVerification: true, email: "a@b.com" });
  assert.deepEqual({ ...new MessageResponseDto("Hecho") }, { ok: true, message: "Hecho" });
  assert.deepEqual({ ...new ErrorResponseDto("Falla", ["x"]) }, { ok: false, message: "Falla", errors: ["x"] });
  assert.equal(new HealthResponseDto({ databaseAvailable: false }).database, "unreachable");
});
