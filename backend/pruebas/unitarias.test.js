// Pruebas unitarias: vistas (DTOs), utilidades y reglas de negocio de los servicios.
// No necesitan la base de datos: en los servicios, los modelos se reemplazan por dobles (mock).
// Heartbeat rápido para probar la revalidación del SSE (debe fijarse antes de cargar servicios/eventos).
process.env.SSE_HEARTBEAT_MS = "30";
const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const { HttpError, isValidEmail, isValidHttpMethod, isPositiveInteger, toRoutePattern } = require("../configuracion");
const { MessageResponseDto, ErrorResponseDto } = require("../vistas/comunes");
const { CredentialsRequestDto, ForgotPasswordRequestDto, ResetPasswordRequestDto, RegisterRequestDto, VerifyCodeRequestDto, SessionResponseDto, VerificationRequiredResponseDto } = require("../vistas/autenticacion");
const {
  ListUsersRequestDto,
  UserIdRequestDto,
  CreateUserRequestDto,
  UpdateUserRequestDto,
  ChangePasswordRequestDto,
  UserDto,
  UserListResponseDto,
} = require("../vistas/usuarios");
const { CreateMonitoredEndpointRequestDto, MonitoredEndpointIdRequestDto, MonitoredEndpointDto, MonitoredEndpointDetailResponseDto } = require("../vistas/monitoreo");
const { HealthResponseDto, ListRequestLogsRequestDto, RequestLogIdRequestDto, RequestLogDetailResponseDto } = require("../vistas/metricas");
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
const VerificationCode = require("../modelos/codigo-verificacion");
const { mail, tokens } = require("../externos");

// ================= Vistas (DTOs) =================

const user = { id: 1, name: "Ana", email: "a@b.com", passwordHash: "secreto", role: "user", emailVerified: true };

// Petición

test("CredentialsRequestDto normaliza el correo y exige contraseña", () => {
  const dto = new CredentialsRequestDto({ email: "  ADMIN@Axon.com ", password: "" });
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

test("CreateUserRequestDto solo acepta los roles admin y user (otro valor → error; sin rol → user)", () => {
  const base = { name: "Ana", email: "a@b.com", password: "clave1234" };
  assert.equal(new CreateUserRequestDto(base).role, "user");
  assert.equal(new CreateUserRequestDto({ ...base, role: "admin" }).role, "admin");
  for (const role of ["superadmin", "Admin", "inactive", 5, {}]) {
    assert.deepEqual(new CreateUserRequestDto({ ...base, role }).validate(), ["El rol debe ser admin o user"], String(role));
    assert.throws(() => new CreateUserRequestDto({ ...base, role }).assertValid(), { statusCode: 400, message: "El rol debe ser admin o user" });
  }
  assert.deepEqual(new UpdateUserRequestDto({ id: "1", role: "Admin" }).validate(), ["El rol debe ser admin o user"]);
});

test("contraseña: 8 a 72 caracteres; correo con coma o contraseña no texto → error", () => {
  const dto = (password) => new RegisterRequestDto({ name: "Ana", email: "a@b.com", password });
  assert.equal(dto("1234567").validate().length, 1);
  assert.equal(dto("12345678").validate().length, 0);
  assert.equal(dto("a".repeat(72)).validate().length, 0);
  assert.equal(dto("a".repeat(73)).validate().length, 1);
  assert.equal(dto({ $ne: 1 }).validate().length, 1);
  assert.equal(new RegisterRequestDto({ name: "Ana", email: "a@b.com,c@d.com", password: "12345678" }).validate().length, 1);
  assert.equal(new ForgotPasswordRequestDto({ email: "a@b.com,c@d.com" }).validate().length, 1);
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
  const dto = new MonitoredEndpointDto(endpoint, { total: 8, errors: 2, errorRate: 0.25, avgLatencyMs: 12 }, "failing");
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
  assert.equal(summary.usersTotal, 3); // solo cuentas activas
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
    assert.deepEqual(Object.keys(activity).sort(), ["createdAt", "id", "latencyMs", "method", "path", "statusCode"]);
  } finally {
    eventService.unsubscribe(clientId);
    eventService.closeAll(); // detiene el heartbeat para que el proceso termine
  }
  assert.equal(eventService.countClients(), 0);
  eventService.publish("api:activity", {});
  assert.equal(writes.length, 2);
});

// ================= Grupo T: login, recuperación, token_version y detalles =================

// ---------- T1: User.validateCredentials ----------

test("User.validateCredentials: null si el correo no existe o la contraseña falla; User si es correcta", async () => {
  const row = { id: "15", name: "Ana", email: "ana@axon.com", role: "user", email_verified: true, password_hash: bcrypt.hashSync("clave123", 4) };
  const find = test.mock.method(User, "findByEmail", async () => new User(row));
  assert.equal(await User.validateCredentials("ana@axon.com", "mala"), null);
  const ok = await User.validateCredentials("ana@axon.com", "clave123");
  assert.equal(ok.id, 15); // el id "15" pasa a número
  assert.equal(find.mock.callCount(), 2);
  find.mock.restore();
  test.mock.method(User, "findByEmail", async () => null);
  assert.equal(await User.validateCredentials("nadie@axon.com", "x"), null);
});

test("User convierte ids de texto en números y tokenVersion ausente en 0", () => {
  const u = new User({ id: "15", created_by_id: "3" });
  assert.equal(u.id, 15);
  assert.equal(u.createdById, 3);
  assert.equal(u.tokenVersion, 0);
  assert.equal(new RequestLog({ id: "4", user_id: "9" }).userId, 9);
  assert.equal(new RequestLog({ id: "4", user_id: null }).userId, null);
});

// ---------- T2: DTOs nuevos ----------

test("CredentialsRequestDto normaliza el correo y ya no existe el alias LoginRequestDto", () => {
  assert.equal(require("../vistas/autenticacion").LoginRequestDto, undefined);
  assert.equal(authService.login, undefined);
  const dto = new CredentialsRequestDto({ email: " A@B.com ", password: "x" });
  assert.equal(dto.email, "a@b.com");
  assert.deepEqual(dto.validate(), []);
});

test("ForgotPasswordRequestDto y ResetPasswordRequestDto validan correo, código y contraseña", () => {
  assert.equal(new ForgotPasswordRequestDto({ email: "malo" }).validate().length, 1);
  assert.deepEqual(new ForgotPasswordRequestDto({ email: "A@b.com" }).validate(), []);
  assert.equal(new ResetPasswordRequestDto({ email: "a@b.com", code: "123456", password: "nueva123" }).validate().length, 0);
  assert.equal(new ResetPasswordRequestDto({ email: "x", code: "12", password: "1" }).validate().length, 3);
});

test("RequestLogIdRequestDto valida el id", () => {
  assert.deepEqual(new RequestLogIdRequestDto({ id: "5" }).validate(), []);
  assert.equal(new RequestLogIdRequestDto({ id: "0" }).validate().length, 1);
  assert.equal(new RequestLogIdRequestDto({ id: "abc" }).validate().length, 1);
});

test("RequestLogDetailResponseDto incluye al usuario sin hash y MonitoredEndpointDetailResponseDto las peticiones", () => {
  const log = new RequestLog({ id: 7, method: "GET", path: "/api/users", route: "/api/users", status_code: 200, latency_ms: 4, user_id: 2 });
  const dto = new RequestLogDetailResponseDto({ log, user: ana });
  assert.deepEqual(dto.data.user, { id: 2, name: "Ana", email: "ana@axon.com" });
  assert.equal(dto.data.userId, 2);
  assert.ok(!JSON.stringify(dto).match(/hash|token/i));
  assert.equal(new RequestLogDetailResponseDto({ log: { ...log, userId: null }, user: null }).data.user, null);

  const endpoint = { id: 1, name: "U", method: "GET", path: "/api/users" };
  const detail = new MonitoredEndpointDetailResponseDto({ endpoint, stats: undefined, status: "no-traffic", recentRequests: [log] });
  assert.equal(detail.ok, true);
  assert.equal(detail.data.recentRequests.length, 1);
  assert.equal(detail.data.recentRequests[0].id, 7);
  assert.equal(detail.data.status, "no-traffic");
});

test("SimulationResponseDto usa el path recibido (alias /api/axonApi)", () => {
  const layers = Object.fromEntries(["client", "api", "backend", "database"].map((k) => [k, { detail: "", durationMs: 0 }]));
  const result = { request: { operation: "users", startedAt: "x" }, layers, data: {}, totalMs: 0 };
  assert.equal(new SimulationResponseDto(result).request.path, "/api/simulations");
  assert.equal(new SimulationResponseDto(result, { path: "/api/axonApi" }).request.path, "/api/axonApi");
});

// ---------- T3: servicio de autenticación ----------

test("validateCredentials: 401 si falla, 403 si está inactivo y 403 EMAIL_NOT_VERIFIED si no verificó", async () => {
  const stub = (u) => test.mock.method(User, "validateCredentials", async () => u);
  stub(null);
  await assert.rejects(authService.validateCredentials({ email: "a@b.com", password: "x" }), { statusCode: 401 });
  test.mock.restoreAll();
  stub(makeUser({ id: 3, role: "inactive" }));
  await assert.rejects(authService.validateCredentials({ email: "a@b.com", password: "x" }), { statusCode: 403 });
  test.mock.restoreAll();
  stub(makeUser({ id: 3, role: "user", email_verified: false }));
  await assert.rejects(authService.validateCredentials({ email: "a@b.com", password: "x" }), { statusCode: 403, code: "EMAIL_NOT_VERIFIED" });
  test.mock.restoreAll();
  stub(ana);
  assert.equal((await authService.validateCredentials({ email: "a@b.com", password: "x" })).id, 2);
});

// Dobles para el envío de códigos
function mockCodes() {
  return {
    invalidate: test.mock.method(VerificationCode, "invalidateAll", async () => {}),
    create: test.mock.method(VerificationCode, "create", async () => {}),
    send: test.mock.method(mail, "sendVerificationCode", async () => {}),
  };
}

test("startLoginVerification emite un código de propósito login", async () => {
  const { create, send } = mockCodes();
  assert.deepEqual(await authService.startLoginVerification(ana), { email: "ana@axon.com" });
  assert.equal(create.mock.calls[0].arguments[0].purpose, "login");
  assert.equal(send.mock.calls[0].arguments[2], "login");
});

test("requestPasswordReset no hace nada si no existe, está inactivo o sin verificar", async () => {
  const { create } = mockCodes();
  const find = test.mock.method(User, "findByEmail", async () => null);
  await authService.requestPasswordReset({ email: "nadie@axon.com" });
  find.mock.restore();
  // Un correo distinto en cada llamada para no chocar con el enfriamiento de 30 s.
  for (const [i, data] of [{ id: 3, role: "inactive" }, { id: 3, role: "user", email_verified: false }].entries()) {
    test.mock.method(User, "findByEmail", async () => makeUser(data));
    await authService.requestPasswordReset({ email: `x${i}@axon.com` });
    User.findByEmail.mock.restore();
  }
  assert.equal(create.mock.callCount(), 0);
  test.mock.method(User, "findByEmail", async () => ana);
  await authService.requestPasswordReset({ email: "ana@axon.com" });
  assert.equal(create.mock.callCount(), 1);
  assert.equal(create.mock.calls[0].arguments[0].purpose, "password_reset");
  // Una segunda solicitud inmediata para el mismo correo se frena.
  await assert.rejects(authService.requestPasswordReset({ email: "ana@axon.com" }), { statusCode: 429 });
});

test("resetPassword: código malo → 401 sin updatePassword; código bueno → updatePassword + invalidar login", async () => {
  const update = test.mock.method(User, "updatePassword", async () => {});
  const invalidate = test.mock.method(VerificationCode, "invalidateAll", async () => {});
  test.mock.method(User, "findByEmail", async () => makeUser({ id: 2, role: "user", token_version: 4 }));
  test.mock.method(VerificationCode, "markUsed", async () => {});
  test.mock.method(VerificationCode, "incrementAttempts", async () => 1);
  const find = test.mock.method(VerificationCode, "findActive", async () => null);

  await assert.rejects(authService.resetPassword({ email: "ana@axon.com", code: "000000", password: "nueva12" }), { statusCode: 401 });
  find.mock.restore();
  const record = { id: 1, attempts: 0, codeHash: bcrypt.hashSync("123456", 4) };
  test.mock.method(VerificationCode, "findActive", async () => record);
  await assert.rejects(authService.resetPassword({ email: "ana@axon.com", code: "999999", password: "nueva12" }), { statusCode: 401 });
  assert.equal(update.mock.callCount(), 0);

  await authService.resetPassword({ email: "ana@axon.com", code: "123456", password: "nueva12" });
  assert.equal(update.mock.callCount(), 1);
  assert.equal(update.mock.calls[0].arguments[2], 5); // token_version + 1
  assert.deepEqual(invalidate.mock.calls.at(-1).arguments, ["ana@axon.com", "login"]);
});

// ---------- token_version ----------

test("un token de acceso con versión vieja devuelve 401; con la versión actual sirve", async () => {
  const current = makeUser({ id: 2, role: "user", token_version: 1 });
  test.mock.method(User, "findById", async () => current);
  const old = tokens.issue(makeUser({ id: 2, role: "user", token_version: 0 }));
  await assert.rejects(authService.authenticateToken(old.accessToken), { statusCode: 401, message: /ya no es válida/ });
  const fresh = tokens.issue(current);
  assert.equal((await authService.authenticateToken(fresh.accessToken)).id, 2);
});

test("tras resetPassword el refresh token viejo devuelve 401 y el nuevo sirve", async () => {
  let stored = makeUser({ id: 2, role: "user", token_version: 0 });
  const oldSession = tokens.issue(stored);
  test.mock.method(User, "findById", async () => stored);
  test.mock.method(User, "findByEmail", async () => stored);
  test.mock.method(User, "updatePassword", async (id, hash, version) => {
    stored = makeUser({ id, role: "user", token_version: version });
  });
  test.mock.method(VerificationCode, "invalidateAll", async () => {});
  test.mock.method(VerificationCode, "incrementAttempts", async () => 1);
  test.mock.method(VerificationCode, "markUsed", async () => {});
  test.mock.method(VerificationCode, "findActive", async () => ({ id: 1, attempts: 0, codeHash: bcrypt.hashSync("123456", 4) }));

  assert.equal((await authService.refreshSession({ refreshToken: oldSession.refreshToken })).user.id, 2);
  await authService.resetPassword({ email: "a@b.com", code: "123456", password: "nueva12" });
  await assert.rejects(authService.refreshSession({ refreshToken: oldSession.refreshToken }), { statusCode: 401 });
  const fresh = await authService.refreshSession({ refreshToken: tokens.issue(stored).refreshToken });
  assert.equal(fresh.user.tokenVersion, 1);
});

test("changePassword propio devuelve sesión nueva y la vieja deja de servir", async () => {
  let stored = makeUser({ id: 2, role: "user", token_version: 0, password_hash: bcrypt.hashSync("actual1", 4) });
  const oldSession = tokens.issue(stored);
  test.mock.method(User, "findById", async () => stored);
  test.mock.method(User, "updatePassword", async (id, hash, version) => {
    stored = makeUser({ id, role: "user", token_version: version, password_hash: hash });
  });
  const session = await userService.changePassword(2, { currentPassword: "actual1", password: "nueva12" }, stored);
  assert.ok(session.accessToken && session.refreshToken);
  assert.equal((await authService.authenticateToken(session.accessToken)).id, 2);
  await assert.rejects(authService.authenticateToken(oldSession.accessToken), { statusCode: 401 });
  await assert.rejects(authService.refreshSession({ refreshToken: oldSession.refreshToken }), { statusCode: 401 });
});

test("changePassword del admin sobre otro usuario incrementa tokenVersion y no devuelve sesión", async () => {
  const target = makeUser({ id: 2, role: "user", token_version: 3 });
  usersById(target);
  const update = test.mock.method(User, "updatePassword", async () => {});
  const result = await userService.changePassword(2, { password: "nueva12" }, admin);
  assert.equal(result, null);
  assert.equal(update.mock.calls[0].arguments[2], 4);
});

// ---------- T4: detalles ----------

test("monitoringService.getById: 404 si no existe y consulta findPage con method/route", async () => {
  const find = test.mock.method(MonitoredEndpoint, "findById", async () => null);
  await assert.rejects(monitoringService.getById(9), { statusCode: 404 });
  find.mock.restore();
  test.mock.method(MonitoredEndpoint, "findById", async () => ({ id: 1, method: "GET", path: "/api/users" }));
  test.mock.method(RequestLog, "getStatsByRoute", async () => [{ method: "GET", route: "/api/users", total: 10, errors: 5 }]);
  const page = test.mock.method(RequestLog, "findPage", async () => ({ logs: [{ id: 1 }], total: 1 }));
  const detail = await monitoringService.getById(1);
  assert.deepEqual(page.mock.calls[0].arguments[0], { page: 1, limit: 10, method: "GET", route: "/api/users" });
  assert.equal(detail.status, "failing");
  assert.equal(detail.recentRequests.length, 1);
});

test("metricsService.getRequest: 404, con usuario y sin usuario", async () => {
  const find = test.mock.method(RequestLog, "findById", async () => null);
  await assert.rejects(metricsService.getRequest(9), { statusCode: 404 });
  find.mock.restore();
  test.mock.method(RequestLog, "findById", async () => ({ id: 1, userId: 2 }));
  usersById(ana);
  assert.equal((await metricsService.getRequest(1)).user.id, 2);
  RequestLog.findById.mock.restore();
  test.mock.method(RequestLog, "findById", async () => ({ id: 2, userId: null }));
  assert.equal((await metricsService.getRequest(2)).user, null);
});

// ================= Grupo D: revisión de seguridad =================

const { EventEmitter } = require("node:events");
const { requestLogger } = require("../middlewares/registro-peticiones");
const { listApiRoutes } = require("../controladores");
const { db } = require("../externos");

// ---------- Intentos del código atómicos ----------

test("10 verificaciones en paralelo con código malo no pasan de 5 comparaciones (contador atómico)", async () => {
  let counter = 0; // simula el contador atómico de la API externa
  test.mock.method(VerificationCode, "findActive", async () => ({ id: 1, attempts: 0, codeHash: bcrypt.hashSync("123456", 4) }));
  const increment = test.mock.method(VerificationCode, "incrementAttempts", async () => ++counter);
  const markUsed = test.mock.method(VerificationCode, "markUsed", async () => {});
  test.mock.method(User, "findByEmail", async () => ana);

  const results = await Promise.allSettled(
    Array.from({ length: 10 }, () => authService.verifyLogin({ email: "ana@axon.com", code: "000000" }))
  );
  const codes = results.map((r) => r.reason.statusCode);
  assert.equal(increment.mock.callCount(), 10);
  assert.equal(codes.filter((c) => c === 401).length, 5); // solo 5 llegaron a comparar
  assert.equal(codes.filter((c) => c === 429).length, 5);
  assert.equal(markUsed.mock.callCount(), 0);
  assert.equal(results[0].reason.message, "Código inválido o expirado");
});

test("código inexistente e incorrecto dan el mismo mensaje", async () => {
  const find = test.mock.method(VerificationCode, "findActive", async () => null);
  await assert.rejects(authService.verifyLogin({ email: "a@b.com", code: "111111" }), { statusCode: 401, message: "Código inválido o expirado" });
  find.mock.restore();
  test.mock.method(VerificationCode, "findActive", async () => ({ id: 1, codeHash: bcrypt.hashSync("123456", 4) }));
  test.mock.method(VerificationCode, "incrementAttempts", async () => 1);
  await assert.rejects(authService.verifyLogin({ email: "a@b.com", code: "111111" }), { statusCode: 401, message: "Código inválido o expirado" });
});

test("resendCode: el segundo envío inmediato al mismo correo da 429 (enfriamiento)", async () => {
  mockCodes();
  test.mock.method(User, "findByEmail", async () => ana);
  const email = `cool-${Date.now()}@axon.com`;
  await authService.resendCode({ email, purpose: "login" });
  await assert.rejects(authService.resendCode({ email, purpose: "login" }), { statusCode: 429, message: /Espera unos segundos/ });
});

// ---------- Base de datos externa ----------

test("un 409 de la API externa se traduce en 409 'El recurso ya existe'; otros errores en 502 genérico", async () => {
  const reply = (status, body) => test.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify(body), { status }));
  reply(409, { message: "duplicate key secreto" });
  await assert.rejects(db.post("/users", {}), { statusCode: 409, message: "El recurso ya existe" });
  test.mock.restoreAll();
  reply(500, { message: "SQL interno" });
  await assert.rejects(db.get("/users"), (e) => e.statusCode === 502 && !/SQL/.test(e.message));
});

// ---------- Vistas: IP de origen solo para admin ----------

test("RequestLogDto incluye source solo si se pide; el detalle de monitoreo no lo da a un usuario común", () => {
  const { RequestLogDto } = require("../vistas/metricas");
  const log = { id: 1, method: "GET", path: "/api/users", route: "/api/users", statusCode: 200, latencyMs: 3, source: "10.0.0.9" };
  assert.equal("source" in new RequestLogDto(log), false);
  assert.equal(new RequestLogDto(log, { includeSource: true }).source, "10.0.0.9");

  const input = { endpoint: { id: 1, name: "U", method: "GET", path: "/api/users" }, stats: undefined, status: "no-traffic", recentRequests: [log] };
  const common = new MonitoredEndpointDetailResponseDto(input);
  assert.equal("source" in common.data.recentRequests[0], false);
  assert.ok(!JSON.stringify(common).includes("10.0.0.9"));
  const asAdmin = new MonitoredEndpointDetailResponseDto(input, { isAdmin: true });
  assert.equal(asAdmin.data.recentRequests[0].source, "10.0.0.9");
});

test("el dashboard reutiliza el errorRate del servicio de monitoreo (DTO sin recalcular)", () => {
  const endpoint = { id: 1, name: "U", method: "GET", path: "/api/users" };
  assert.equal(new MonitoredEndpointDto(endpoint, { total: 3, errors: 1, errorRate: 0.33 }, "healthy").stats.errorRate, 0.33);
});

// ---------- Registro de peticiones ----------

function fakeRequest(url, { notFound = false } = {}) {
  const req = { method: "GET", originalUrl: url, ip: "1.2.3.4", user: null };
  const res = new EventEmitter();
  res.statusCode = notFound ? 404 : 200;
  res.locals = notFound ? { notFound: true } : {};
  requestLogger(req, res, () => {});
  res.emit("finish");
  return res;
}

test("registro de peticiones: no guarda los 404 de rutas inexistentes ni el stream; sí guarda el resto", () => {
  const create = test.mock.method(RequestLog, "create", async () => 1);
  fakeRequest("/api/no-existe", { notFound: true });
  fakeRequest("/api/events/stream?token=abc");
  assert.equal(create.mock.callCount(), 0);
  fakeRequest("/api/users/5?x=1");
  assert.equal(create.mock.callCount(), 1);
  assert.equal(create.mock.calls[0].arguments[0].route, "/api/users/:id");
  assert.equal(create.mock.calls[0].arguments[0].path, "/api/users/5");
});

test("listApiRoutes no incluye /api/events/stream pero sí otras rutas", () => {
  const routes = listApiRoutes();
  assert.ok(!routes.some((r) => r.path === "/api/events/stream"));
  assert.ok(routes.some((r) => r.method === "POST" && r.path === "/api/auth/login"));
  assert.ok(routes.some((r) => r.path === "/api/events/ping"));
});

// ---------- SSE: tope por usuario y revalidación ----------

function fakeStream() {
  const stream = { writes: [], ended: false, write(chunk) { this.writes.push(chunk); }, end() { this.ended = true; } };
  stream.closedWith = () => stream.writes.map((w) => /event: stream:closed\ndata: (.*)\n/.exec(w)?.[1]).filter(Boolean).map((d) => JSON.parse(d).reason);
  return stream;
}

test("SSE: el 4.º stream del mismo usuario cierra el más viejo con too-many-streams", () => {
  eventService.closeAll();
  const streams = Array.from({ length: 4 }, fakeStream);
  const other = fakeStream();
  try {
    streams.slice(0, 3).forEach((s) => eventService.subscribe(s, admin, "t"));
    eventService.subscribe(other, makeUser({ id: 77, role: "admin" }), "t"); // otro usuario no cuenta
    assert.equal(eventService.countClients(), 4);
    eventService.subscribe(streams[3], admin, "t");
    assert.deepEqual(streams[0].closedWith(), ["too-many-streams"]);
    assert.equal(streams[0].ended, true);
    assert.equal(streams[1].ended, false);
    assert.equal(eventService.countClients(), 4); // 3 del admin + 1 de otro
  } finally {
    eventService.closeAll();
  }
});

test("SSE: en cada heartbeat se revalida el token y se cierra con session-invalid si falla o deja de ser admin", async () => {
  eventService.closeAll();
  let mode = "ok";
  test.mock.method(authService, "authenticateToken", async (token) => {
    if (token === "malo" && mode === "fail") throw Object.assign(new Error("expirado"), { statusCode: 401 });
    if (token === "bd-caida") throw Object.assign(new Error("BD no disponible"), { statusCode: 503 });
    if (token === "degradado") return makeUser({ id: 3, role: "user" });
    return admin;
  });
  const good = fakeStream(), bad = fakeStream(), demoted = fakeStream(), dbDown = fakeStream();
  try {
    eventService.subscribe(good, admin, "bueno");
    eventService.subscribe(bad, makeUser({ id: 8, role: "admin" }), "malo");
    eventService.subscribe(demoted, makeUser({ id: 9, role: "admin" }), "degradado");
    eventService.subscribe(dbDown, makeUser({ id: 10, role: "admin" }), "bd-caida");
    await new Promise((r) => setTimeout(r, 100)); // con SSE_HEARTBEAT_MS=30 hay varios latidos
    assert.deepEqual(demoted.closedWith(), ["session-invalid"]);
    assert.deepEqual(bad.closedWith(), []); // aún válido
    mode = "fail";
    await new Promise((r) => setTimeout(r, 100));
    assert.deepEqual(bad.closedWith(), ["session-invalid"]);
    assert.equal(bad.ended, true);
    assert.deepEqual(good.closedWith(), []);
    assert.deepEqual(dbDown.closedWith(), []); // un fallo pasajero de la BD no cierra el stream
    assert.equal(eventService.countClients(), 2);
  } finally {
    eventService.closeAll();
  }
});
