const test = require("node:test");
const assert = require("node:assert/strict");
const { MessageResponseDto, ErrorResponseDto } = require("../../vistas/comunes");
const { SessionResponseDto, VerificationRequiredResponseDto } = require("../../vistas/autenticacion");
const { UserDto, UserListResponseDto } = require("../../vistas/usuarios");
const { MonitoredEndpointDto, MonitoredEndpointDetailResponseDto: Detalle } = require("../../vistas/monitoreo");
const { HealthResponseDto, RequestLogDetailResponseDto, RequestLogDto } = require("../../vistas/metricas");
const { SimulationResponseDto } = require("../../vistas/simulacion");
const RequestLog = require("../../modelos/registro-peticion");
const { ana, plainUser } = require("./ayudantes");

const endpoint = { id: 1, name: "U", method: "GET", path: "/api/users" };

test("los DTO de usuario nunca exponen el hash; la sesión entrega tokens", () => {
  assert.equal("passwordHash" in new UserDto(plainUser), false);
  const dto = new SessionResponseDto({ accessToken: "a", refreshToken: "r", user: plainUser });
  assert.deepEqual([dto.ok, "passwordHash" in dto.user], [true, false]);
});

test("UserListResponseDto arma data y meta con el total de páginas", () => {
  assert.deepEqual(new UserListResponseDto({ users: [plainUser], total: 45, page: 2, limit: 20 }).meta, { total: 45, page: 2, limit: 20, totalPages: 3 });
  assert.equal(new UserListResponseDto({ users: [], total: 0, page: 1, limit: 20 }).meta.totalPages, 1);
});

test("MonitoredEndpointDto: estadísticas en cero sin peticiones; reutiliza errorRate y status", () => {
  assert.deepEqual(new MonitoredEndpointDto(endpoint).stats, { requests: 0, errors: 0, errorRate: 0, avgLatencyMs: 0, lastRequestAt: null });
  const dto = new MonitoredEndpointDto(endpoint, { total: 8, errors: 2, errorRate: 0.25, avgLatencyMs: 12 }, "failing");
  assert.deepEqual([dto.stats.requests, dto.stats.errorRate, dto.status], [8, 0.25, "failing"]);
  assert.equal(new MonitoredEndpointDto(endpoint, { total: 3, errors: 1, errorRate: 0.33 }, "healthy").stats.errorRate, 0.33);
});

test("respuestas comunes y de estado tienen el formato esperado", () => {
  const casos = [
    [new VerificationRequiredResponseDto({ email: "a@b.com" }), { ok: true, requiresVerification: true, email: "a@b.com" }],
    [new MessageResponseDto("Hecho"), { ok: true, message: "Hecho" }],
    [new ErrorResponseDto("Falla"), { ok: false, message: "Falla" }],
    [new ErrorResponseDto("Falla", { errors: ["x"], code: "C", path: "/api/x", method: "GET" }), { ok: false, message: "Falla", errors: ["x"], code: "C", path: "/api/x", method: "GET" }],
  ];
  for (const [dto, esperado] of casos) assert.deepEqual({ ...dto }, esperado);
});

test("HealthResponseDto: online/connected o degraded/disconnected", () => {
  const up = new HealthResponseDto({ databaseAvailable: true, databaseLatencyMs: 5, uptimeSeconds: 10 });
  assert.deepEqual([up.ok, up.status, up.database, up.service, up.databaseLatencyMs], [true, "online", "connected", "axon-api", 5]);
  const down = new HealthResponseDto({ databaseAvailable: false });
  assert.deepEqual([down.ok, down.status, down.database], [false, "degraded", "disconnected"]);
});

test("SimulationResponseDto ordena las cuatro capas y usa el path recibido", () => {
  const layer = (durationMs) => ({ detail: "d", durationMs });
  const result = { request: { operation: "users", startedAt: "t" }, data: {}, totalMs: 10, layers: { database: layer(4), backend: layer(3), api: layer(2), client: layer(1) } };
  const dto = new SimulationResponseDto(result);
  assert.deepEqual(dto.layers.map((l) => l.key), ["client", "api", "backend", "database"]);
  assert.deepEqual(dto.layers.map((l) => l.order), [1, 2, 3, 4]);
  assert.equal(dto.request.path, "/api/simulations");
  assert.equal(new SimulationResponseDto(result, { path: "/api/axonApi" }).request.path, "/api/axonApi");
});

test("el detalle de petición incluye al usuario sin hash; el de monitoreo, las peticiones", () => {
  const log = new RequestLog({ id: 7, method: "GET", path: "/api/users", route: "/api/users", status_code: 200, latency_ms: 4, user_id: 2 });
  const dto = new RequestLogDetailResponseDto({ log, user: ana });
  assert.deepEqual(dto.data.user, { id: 2, name: "Ana", email: "ana@axon.com" });
  assert.equal(dto.data.userId, 2);
  assert.ok(!JSON.stringify(dto).match(/hash|token/i));
  assert.equal(new RequestLogDetailResponseDto({ log: { ...log, userId: null }, user: null }).data.user, null);
  const detail = new Detalle({ endpoint, stats: undefined, status: "no-traffic", recentRequests: [log] });
  assert.deepEqual([detail.ok, detail.data.recentRequests.length, detail.data.recentRequests[0].id, detail.data.status], [true, 1, 7, "no-traffic"]);
});

test("source solo se incluye si se pide; el detalle de monitoreo no lo da a un usuario común", () => {
  const log = { id: 1, method: "GET", path: "/api/users", route: "/api/users", statusCode: 200, latencyMs: 3, source: "10.0.0.9" };
  assert.equal("source" in new RequestLogDto(log), false);
  assert.equal(new RequestLogDto(log, { includeSource: true }).source, "10.0.0.9");
  const input = { endpoint, stats: undefined, status: "no-traffic", recentRequests: [log] };
  const common = new Detalle(input);
  assert.equal("source" in common.data.recentRequests[0], false);
  assert.ok(!JSON.stringify(common).includes("10.0.0.9"));
  assert.equal(new Detalle(input, { isAdmin: true }).data.recentRequests[0].source, "10.0.0.9");
});
