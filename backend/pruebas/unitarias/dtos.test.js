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
const { CreateMonitoredEndpointRequestDto, MonitoredEndpointIdRequestDto } = require("../../codigo/dtos/peticion/monitoreo");
const { UserDto, UserListResponseDto } = require("../../codigo/dtos/respuesta/usuarios");
const { SessionResponseDto, VerificationRequiredResponseDto } = require("../../codigo/dtos/respuesta/autenticacion");
const { MonitoredEndpointDto } = require("../../codigo/dtos/respuesta/monitoreo");
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
  assert.equal(new ChangePasswordRequestDto({ id: "3", currentPassword: "vieja1", password: "nueva1" }).currentPassword, "vieja1");
});

test("ListUsersRequestDto usa 20 por defecto y no pasa de 100", () => {
  assert.deepEqual({ ...new ListUsersRequestDto({}) }, { page: 1, limit: 20 });
  assert.deepEqual({ ...new ListUsersRequestDto({ page: "0", limit: "999" }) }, { page: 1, limit: 100 });
});

test("CreateMonitoredEndpointRequestDto valida ruta /api/ y método HTTP", () => {
  const dto = new CreateMonitoredEndpointRequestDto({ name: "Login", path: "/api/auth/login", method: "post" });
  assert.equal(dto.method, "POST");
  assert.equal(dto.validate().length, 0);
  assert.equal(new CreateMonitoredEndpointRequestDto({ name: "X", path: "/otra", method: "FETCH" }).validate().length, 2);
  assert.equal(new MonitoredEndpointIdRequestDto({ id: "-1" }).validate().length, 1);
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

test("UserListResponseDto arma data y meta con el total de páginas", () => {
  const dto = new UserListResponseDto({ users: [user], total: 45, page: 2, limit: 20 });
  assert.deepEqual(dto.meta, { total: 45, page: 2, limit: 20, totalPages: 3 });
  assert.equal(new UserListResponseDto({ users: [], total: 0, page: 1, limit: 20 }).meta.totalPages, 1);
});

test("MonitoredEndpointDto pone las estadísticas en cero si aún no hay peticiones", () => {
  const endpoint = { id: 1, name: "Login", method: "POST", path: "/api/auth/login" };
  assert.deepEqual(new MonitoredEndpointDto(endpoint).stats, { requests: 0, errors: 0, avgLatencyMs: 0, lastRequestAt: null });
  assert.equal(new MonitoredEndpointDto(endpoint, { total: 8, errors: 2, avgLatencyMs: 12 }).stats.requests, 8);
});

test("Respuestas comunes y de estado tienen el formato esperado", () => {
  assert.deepEqual({ ...new VerificationRequiredResponseDto({ email: "a@b.com" }) }, { ok: true, requiresVerification: true, email: "a@b.com" });
  assert.deepEqual({ ...new MessageResponseDto("Hecho") }, { ok: true, message: "Hecho" });
  assert.deepEqual({ ...new ErrorResponseDto("Falla", ["x"]) }, { ok: false, message: "Falla", errors: ["x"] });
  assert.equal(new HealthResponseDto({ databaseAvailable: false }).database, "unreachable");
});
