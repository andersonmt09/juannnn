const test = require("node:test");
const assert = require("node:assert/strict");
const MonitoredEndpoint = require("../../modelos/rutas_vigiladas_modelo");
const RequestLog = require("../../modelos/registros_peticiones_modelo");
const monitoringService = require("../../rutas/monitoreo");
require("./ayudantes");

const login = { method: "POST", path: "/api/auth/login" };
const apiRoutes = [login, { method: "GET", path: "/api/users" }];
const dosEndpoints = () => test.mock.method(MonitoredEndpoint, "findAll", async () => [{ id: 1, ...login }, { id: 2, method: "GET", path: "/api/users" }]);
const statsLogin = (errors) => test.mock.method(RequestLog, "getStatsByRoute", async () => [{ method: "POST", route: login.path, total: 10, errors, avgLatencyMs: 40, lastRequestAt: null }]);

test("solo se monitorean rutas que existen y no se repite un endpoint", async () => {
  await assert.rejects(monitoringService.create({ name: "X", method: "GET", path: "/api/no-existe" }, apiRoutes), { statusCode: 400 });
  test.mock.method(MonitoredEndpoint, "findAll", async () => [{ id: 1, ...login }]);
  await assert.rejects(monitoringService.create({ name: "Login", ...login }, apiRoutes), { statusCode: 409 });
});

test("la lista cruza cada endpoint con sus estadísticas y su status", async () => {
  dosEndpoints();
  statsLogin(5);
  const [loginItem, users] = await monitoringService.list();
  assert.equal(loginItem.stats.total, 10);
  assert.equal(users.stats, undefined);
  assert.equal(loginItem.status, "failing");
  assert.equal(users.status, "no-traffic");
});

test("endpointStatus: sin tráfico, con fallas (>= 20 %) y saludable", () => {
  const casos = [[undefined, "no-traffic"], [{ total: 0, errors: 0 }, "no-traffic"], [{ total: 10, errors: 2 }, "failing"], [{ total: 10, errors: 1 }, "healthy"], [{ total: 5, errors: 0 }, "healthy"]];
  for (const [stats, esperado] of casos) assert.equal(monitoringService.endpointStatus(stats), esperado, JSON.stringify(stats));
});

test("getById: 404 si no existe y consulta findPage con method/route", async () => {
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
