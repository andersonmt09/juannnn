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
const { HealthResponseDto, ListRequestLogsRequestDto } = require("../vistas/metricas");
const { RunSimulationRequestDto, SimulationResponseDto } = require("../vistas/simulacion");
const User = require("../modelos/usuario");
const MonitoredEndpoint = require("../modelos/endpoint-monitoreado");
const RequestLog = require("../modelos/registro-peticion");
const authService = require("../servicios/autenticacion");
const userService = require("../servicios/usuarios");
const monitoringService = require("../servicios/monitoreo");
const metricsService = require("../servicios/metricas");
const simulationService = require("../servicios/simulacion");
const eventService = require("../servicios/eventos");

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
  assert.deepEqual(new MonitoredEndpointDto(endpoint).stats, { requests: 0, errors: 0, errorRate: 0, avgLatencyMs: 0, lastRequestAt: null });
  const dto = new MonitoredEndpointDto(endpoint, { total: 8, errors: 2, avgLatencyMs: 12 }, "failing");
  assert.equal(dto.stats.requests, 8);
  assert.equal(dto.stats.errorRate, 0.25);
  assert.equal(dto.status, "failing");
});

test("Respuestas comunes y de estado tienen el formato esperado", () => {
  assert.deepEqual({ ...new VerificationRequiredResponseDto({ email: "a@b.com" }) }, { ok: true, requiresVerification: true, email: "a@b.com" });
  assert.deepEqual({ ...new MessageResponseDto("Hecho") }, { ok: true, message: "Hecho" });
  assert.deepEqual({ ...new ErrorResponseDto("Falla") }, { ok: false, message: "Falla" });
  assert.deepEqual(
    { ...new ErrorResponseDto("Falla", { errors: ["x"], code: "C", path: "/api/x", method: "GET" }) },
    { ok: false, message: "Falla", errors: ["x"], code: "C", path: "/api/x", method: "GET" }
  );
});

test("HealthResponseDto indica online/connected o degraded/disconnected", () => {
  const up = new HealthResponseDto({ databaseAvailable: true, databaseLatencyMs: 5, uptimeSeconds: 10 });
  assert.equal(up.ok, true);
  assert.equal(up.status, "online");
  assert.equal(up.database, "connected");
  assert.equal(up.service, "axon-api");
  assert.equal(up.databaseLatencyMs, 5);
  const down = new HealthResponseDto({ databaseAvailable: false });
  assert.equal(down.ok, false);
  assert.equal(down.status, "degraded");
  assert.equal(down.database, "disconnected");
});

test("ListRequestLogsRequestDto aplica valores por defecto, límites y valida filtros", () => {
  const defaults = new ListRequestLogsRequestDto({});
  assert.equal(defaults.page, 1);
  assert.equal(defaults.limit, 20);
  assert.equal(new ListRequestLogsRequestDto({ limit: "999" }).limit, 100);
  assert.equal(new ListRequestLogsRequestDto({ page: "-3" }).page, 1);
  const ok = new ListRequestLogsRequestDto({ method: "get", statusClass: "4XX" });
  assert.equal(ok.method, "GET");
  assert.equal(ok.statusClass, "4xx");
  assert.deepEqual(ok.validate(), []);
  assert.equal(new ListRequestLogsRequestDto({ method: "FETCH" }).validate().length, 1);
  assert.equal(new ListRequestLogsRequestDto({ statusClass: "6xx" }).validate().length, 1);
});

test("RunSimulationRequestDto usa users por defecto, convierte forceError y valida la operación", () => {
  const dto = new RunSimulationRequestDto({});
  assert.equal(dto.operation, "users");
  assert.equal(dto.forceError, false);
  assert.equal(new RunSimulationRequestDto({ forceError: "true" }).forceError, true);
  assert.equal(new RunSimulationRequestDto({ forceError: "no" }).forceError, false);
  assert.deepEqual(new RunSimulationRequestDto({ operation: "Requests" }).validate(), []);
  assert.deepEqual(new RunSimulationRequestDto({ operation: "otra" }).validate(), ["La operación debe ser una de: users, endpoints, requests"]);
});

test("SimulationResponseDto ordena siempre las cuatro capas", () => {
  const layer = (durationMs) => ({ detail: "d", durationMs });
  const dto = new SimulationResponseDto({
    request: { operation: "users", startedAt: "t" },
    layers: { database: layer(4), backend: layer(3), api: layer(2), client: layer(1) },
    data: {},
    totalMs: 10,
  });
  assert.deepEqual(dto.layers.map((l) => l.key), ["client", "api", "backend", "database"]);
  assert.deepEqual(dto.layers.map((l) => l.order), [1, 2, 3, 4]);
  assert.equal(dto.request.path, "/api/simulations");
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

test("HttpError admite un code estable (también en forbidden)", () => {
  assert.equal(new HttpError(400, "x", undefined, "ABC").code, "ABC");
  const error = HttpError.forbidden("Verifica", "EMAIL_NOT_VERIFIED");
  assert.equal(error.statusCode, 403);
  assert.equal(error.code, "EMAIL_NOT_VERIFIED");
  assert.equal(HttpError.notFound().code, undefined);
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

test("endpointStatus: sin tráfico, con fallas (>= 20 %) y saludable", () => {
  assert.equal(monitoringService.endpointStatus(undefined), "no-traffic");
  assert.equal(monitoringService.endpointStatus({ total: 0, errors: 0 }), "no-traffic");
  assert.equal(monitoringService.endpointStatus({ total: 10, errors: 2 }), "failing");
  assert.equal(monitoringService.endpointStatus({ total: 10, errors: 1 }), "healthy");
  assert.equal(monitoringService.endpointStatus({ total: 5, errors: 0 }), "healthy");
});

test("la lista de monitoreo incluye el status de cada endpoint", async () => {
  test.mock.method(MonitoredEndpoint, "findAll", async () => [
    { id: 1, method: "POST", path: "/api/auth/login" },
    { id: 2, method: "GET", path: "/api/users" },
  ]);
  test.mock.method(RequestLog, "getStatsByRoute", async () => [
    { method: "POST", route: "/api/auth/login", total: 10, errors: 5, avgLatencyMs: 40, lastRequestAt: null },
  ]);
  const [login, users] = await monitoringService.list();
  assert.equal(login.status, "failing");
  assert.equal(users.status, "no-traffic");
});

// ---------- Usuarios: reglas nuevas ----------

test("un administrador no puede cambiar su propio rol, pero sí otros datos", async () => {
  usersById(admin);
  adminCount(2);
  const update = test.mock.method(User, "update", async () => admin);
  await assert.rejects(userService.update(1, { role: "user" }, admin), { statusCode: 400, message: "No puedes cambiar tu propio rol" });
  assert.equal(update.mock.callCount(), 0);
  await userService.update(1, { name: "Nuevo", role: "admin" }, admin);
  assert.equal(update.mock.callCount(), 1);
});

test("un administrador sí puede cambiar el rol de otro usuario", async () => {
  usersById(ana);
  const update = test.mock.method(User, "update", async () => ana);
  await userService.update(2, { role: "admin" }, admin);
  assert.equal(update.mock.callCount(), 1);
});

test("getById: el propio usuario y el admin pueden verlo; otro usuario recibe 403", async () => {
  const luis = makeUser({ id: 3, role: "user" });
  usersById(ana, luis, admin);
  assert.equal((await userService.getById(2, ana)).id, 2);
  assert.equal((await userService.getById(2, admin)).id, 2);
  await assert.rejects(userService.getById(3, ana), { statusCode: 403 });
  await assert.rejects(userService.getById(99, admin), { statusCode: 404 });
});

// ---------- Métricas ----------

test("el dashboard calcula errorsTotal y errorRate con los códigos >= 400", async () => {
  test.mock.method(User, "countByRole", async () => ({ admin: 1, user: 2, inactive: 1 }));
  test.mock.method(MonitoredEndpoint, "findAll", async () => [{ id: 1 }]);
  test.mock.method(RequestLog, "findRecent", async () => []);
  test.mock.method(RequestLog, "getSummary", async () => ({
    total: 20,
    last24h: 5,
    avgLatencyMs: 12,
    byStatus: [{ status: 200, count: 14 }, { status: 404, count: 4 }, { status: 500, count: 2 }],
    byMethod: [],
  }));
  const { summary } = await metricsService.getDashboard();
  assert.equal(summary.errorsTotal, 6);
  assert.equal(summary.errorRate, 0.3);
  assert.equal(summary.usersTotal, 4);
  assert.equal(summary.usersActive, 3);
  assert.equal(summary.monitoredEndpoints, 1);
});

// ---------- Simulación ----------

test("la simulación devuelve las cuatro capas medidas y los datos del modelo", async () => {
  test.mock.method(User, "countByRole", async () => ({ admin: 1, user: 2 }));
  const result = await simulationService.run({ operation: "users", forceError: false });
  assert.deepEqual(Object.keys(result.layers), ["client", "api", "backend", "database"]);
  assert.deepEqual(result.data, { admin: 1, user: 2 });
  assert.equal(result.layers.client.durationMs, 0);
  assert.ok(result.totalMs >= 0);
  const dto = new SimulationResponseDto(result);
  assert.equal(dto.layers.length, 4);
});

test("la simulación de endpoints y peticiones usa su modelo; forceError lanza 500", async () => {
  test.mock.method(MonitoredEndpoint, "findAll", async () => [{ method: "GET", path: "/api/users", name: "Usuarios", id: 1 }]);
  test.mock.method(RequestLog, "getSummary", async () => ({ total: 3 }));
  const endpoints = await simulationService.run({ operation: "endpoints", forceError: false });
  assert.deepEqual(endpoints.data, { total: 1, items: [{ method: "GET", path: "/api/users", name: "Usuarios" }] });
  const requests = await simulationService.run({ operation: "requests", forceError: false });
  assert.equal(requests.data.total, 3);
  await assert.rejects(simulationService.run({ operation: "users", forceError: true }), { statusCode: 500, message: /Fallo simulado/ });
});

// ---------- Eventos (SSE) ----------

test("eventService.publish escribe el evento SSE en cada cliente y unsubscribe lo retira", () => {
  const writes = [];
  const res = { write: (chunk) => writes.push(chunk), end() {} };
  const clientId = eventService.subscribe(res, admin);
  try {
    assert.equal(eventService.countClients(), 1);
    eventService.publish("api:activity", { method: "GET" });
    assert.equal(writes.length, 1);
    assert.equal(writes[0], 'event: api:activity\ndata: {"method":"GET"}\n\n');

    eventService.publishActivity({ method: "POST", path: "/api/x", statusCode: 201, latencyMs: 3, userId: 9 });
    const activity = JSON.parse(writes[1].split("data: ")[1]);
    assert.deepEqual(Object.keys(activity).sort(), ["createdAt", "latencyMs", "method", "path", "statusCode"]);
  } finally {
    eventService.unsubscribe(clientId);
    eventService.closeAll(); // detiene el heartbeat para que el proceso termine
  }
  assert.equal(eventService.countClients(), 0);
  eventService.publish("api:activity", {});
  assert.equal(writes.length, 2);
});
