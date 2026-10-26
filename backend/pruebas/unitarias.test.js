// Pruebas unitarias: vistas (DTOs), utilidades y reglas de negocio de los servicios.
// No necesitan la base de datos: en los servicios, los modelos se reemplazan por dobles (mock).
const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const { HttpError, isValidEmail, isValidHttpMethod, isPositiveInteger, toRoutePattern } = require("../configuracion");
const { MessageResponseDto, ErrorResponseDto } = require("../vistas/comunes");
const { LoginRequestDto, RegisterRequestDto, VerifyCodeRequestDto, SessionResponseDto, VerificationRequiredResponseDto } = require("../vistas/autenticacion");
const {
  ListUsersRequestDto,
  UserIdRequestDto,
  CreateUserRequestDto,
  UpdateUserRequestDto,
  ChangePasswordRequestDto,
  UserDto,
  UserListResponseDto,
} = require("../vistas/usuarios");
const { CreateMonitoredEndpointRequestDto, MonitoredEndpointIdRequestDto, MonitoredEndpointDto } = require("../vistas/monitoreo");
const { HealthResponseDto } = require("../vistas/metricas");
const User = require("../modelos/usuario");
const MonitoredEndpoint = require("../modelos/endpoint-monitoreado");
const RequestLog = require("../modelos/registro-peticion");
const authService = require("../servicios/autenticacion");
const userService = require("../servicios/usuarios");
const monitoringService = require("../servicios/monitoreo");

// ================= Vistas (DTOs) =================

const user = { id: 1, name: "Ana", email: "a@b.com", passwordHash: "secreto", role: "user", emailVerified: true };

// Petición

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

// Respuesta

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

// ================= Utilidades =================

test("isValidEmail", () => {
  assert.equal(isValidEmail("ana@test.com"), true);
  assert.equal(isValidEmail("ana@test"), false);
});

test("isValidHttpMethod", () => {
  assert.equal(isValidHttpMethod("patch"), true);
  assert.equal(isValidHttpMethod("OPTIONS"), false);
});

test("isPositiveInteger", () => {
  assert.equal(isPositiveInteger("12"), true);
  assert.equal(isPositiveInteger("0"), false);
  assert.equal(isPositiveInteger("abc"), false);
});

test("toRoutePattern quita la query y cambia los ids por :id", () => {
  assert.equal(toRoutePattern("/api/users?page=2"), "/api/users");
  assert.equal(toRoutePattern("/api/users/15"), "/api/users/:id");
  assert.equal(toRoutePattern("/api/users/15/password"), "/api/users/:id/password");
  assert.equal(toRoutePattern("/api/monitoring/endpoints/3"), "/api/monitoring/endpoints/:id");
});

test("HttpError conserva el código HTTP", () => {
  assert.equal(HttpError.conflict("x").statusCode, 409);
  assert.equal(HttpError.unauthorized().statusCode, 401);
});

test("generateCode produce 6 dígitos", () => {
  for (let i = 0; i < 50; i++) assert.match(authService.generateCode(), /^\d{6}$/);
});

// ================= Servicios =================

const makeUser = (data) => new User({ email_verified: true, ...data });
const admin = makeUser({ id: 1, name: "Admin", email: "admin@axon.com", role: "admin" });
const ana = makeUser({ id: 2, name: "Ana", email: "ana@axon.com", role: "user", password_hash: bcrypt.hashSync("actual1", 4) });

test.afterEach(() => test.mock.restoreAll());

const usersById = (...users) => test.mock.method(User, "findById", async (id) => users.find((u) => u.id === id) || null);
const adminCount = (n) => test.mock.method(User, "countByRole", async () => ({ admin: n, user: 3 }));

// ---------- Usuarios ----------

test("no se puede eliminar al último administrador", async () => {
  const otherAdmin = makeUser({ id: 5, role: "admin" });
  usersById(otherAdmin);
  adminCount(1);
  const softDelete = test.mock.method(User, "softDelete", async () => {});

  await assert.rejects(userService.remove(5, admin), { statusCode: 400, message: /al menos un administrador/ });
  assert.equal(softDelete.mock.callCount(), 0);
});

test("se puede eliminar un administrador si queda otro", async () => {
  usersById(makeUser({ id: 5, role: "admin" }));
  adminCount(2);
  const softDelete = test.mock.method(User, "softDelete", async () => {});

  await userService.remove(5, admin);
  assert.equal(softDelete.mock.callCount(), 1);
});

test("nadie puede eliminarse a sí mismo", async () => {
  usersById(admin);
  await assert.rejects(userService.remove(1, admin), { statusCode: 400 });
});

test("quitarle el rol al último administrador no se permite", async () => {
  usersById(admin);
  adminCount(1);
  await assert.rejects(userService.update(1, { role: "user" }), { statusCode: 400 });
});

test("cambiar la contraseña propia exige la contraseña actual correcta", async () => {
  usersById(ana);
  const updatePassword = test.mock.method(User, "updatePassword", async () => {});

  await assert.rejects(userService.changePassword(2, { currentPassword: "otra", password: "nueva12" }, ana), { statusCode: 400 });
  await assert.rejects(userService.changePassword(2, { password: "nueva12" }, ana), { statusCode: 400 });
  await userService.changePassword(2, { currentPassword: "actual1", password: "nueva12" }, ana);
  assert.equal(updatePassword.mock.callCount(), 1);
});

test("el administrador cambia la contraseña de otro sin la actual; un usuario común no puede", async () => {
  const luis = makeUser({ id: 3, role: "user" });
  usersById(ana, luis);
  test.mock.method(User, "updatePassword", async () => {});

  await userService.changePassword(2, { password: "nueva12" }, admin);
  await assert.rejects(userService.changePassword(3, { password: "nueva12" }, ana), { statusCode: 403 });
});

test("no se permite cambiar el correo por uno que ya usa otra cuenta", async () => {
  usersById(ana);
  test.mock.method(User, "findByEmail", async () => admin);
  await assert.rejects(userService.update(2, { email: "admin@axon.com" }), { statusCode: 409 });
});

// ---------- Monitoreo ----------

const apiRoutes = [{ method: "POST", path: "/api/auth/login" }, { method: "GET", path: "/api/users" }];

test("solo se pueden monitorear rutas que existen en la API", async () => {
  await assert.rejects(
    monitoringService.create({ name: "X", method: "GET", path: "/api/no-existe" }, apiRoutes),
    { statusCode: 400 }
  );
});

test("no se puede monitorear dos veces el mismo endpoint", async () => {
  test.mock.method(MonitoredEndpoint, "findAll", async () => [{ id: 1, method: "POST", path: "/api/auth/login" }]);
  await assert.rejects(
    monitoringService.create({ name: "Login", method: "POST", path: "/api/auth/login" }, apiRoutes),
    { statusCode: 409 }
  );
});

test("la lista de monitoreo cruza cada endpoint con sus estadísticas", async () => {
  test.mock.method(MonitoredEndpoint, "findAll", async () => [
    { id: 1, method: "POST", path: "/api/auth/login" },
    { id: 2, method: "GET", path: "/api/users" },
  ]);
  test.mock.method(RequestLog, "getStatsByRoute", async () => [
    { method: "POST", route: "/api/auth/login", total: 10, errors: 3, avgLatencyMs: 40, lastRequestAt: null },
  ]);

  const [login, users] = await monitoringService.list();
  assert.equal(login.stats.total, 10);
  assert.equal(users.stats, undefined);
});
