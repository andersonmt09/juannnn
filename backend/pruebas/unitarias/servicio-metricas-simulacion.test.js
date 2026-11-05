const test = require("node:test");
const assert = require("node:assert/strict");
const User = require("../../modelos/usuario");
const MonitoredEndpoint = require("../../modelos/endpoint-monitoreado");
const RequestLog = require("../../modelos/registro-peticion");
const metricsService = require("../../servicios/metricas");
const simulationService = require("../../servicios/simulacion");
const { SimulationResponseDto } = require("../../vistas/simulacion");
const { ana, usersById } = require("./ayudantes");

test("el dashboard calcula errorsTotal y errorRate con los códigos >= 400", async () => {
  test.mock.method(User, "countByRole", async () => ({ admin: 1, user: 2, inactive: 1 }));
  test.mock.method(MonitoredEndpoint, "findAll", async () => [{ id: 1 }]);
  test.mock.method(RequestLog, "findRecent", async () => []);
  test.mock.method(RequestLog, "getSummary", async () => ({
    total: 20, last24h: 5, avgLatencyMs: 12, byMethod: [],
    byStatus: [{ status: 200, count: 14 }, { status: 404, count: 4 }, { status: 500, count: 2 }],
  }));
  const { summary } = await metricsService.getDashboard();
  assert.deepEqual(
    [summary.errorsTotal, summary.errorRate, summary.usersTotal, summary.usersActive, summary.monitoredEndpoints],
    [6, 0.3, 3, 3, 1]
  );
});

test("getRequest: 404, con usuario y sin usuario", async () => {
  const find = test.mock.method(RequestLog, "findById", async () => null);
  await assert.rejects(metricsService.getRequest(9), { statusCode: 404 });
  find.mock.restore();
  test.mock.method(RequestLog, "findById", async (id) => ({ id, userId: id === 1 ? 2 : null }));
  usersById(ana);
  assert.equal((await metricsService.getRequest(1)).user.id, 2);
  assert.equal((await metricsService.getRequest(2)).user, null);
});

test("la simulación de users devuelve las cuatro capas medidas y los datos del modelo", async () => {
  test.mock.method(User, "countByRole", async () => ({ admin: 1, user: 2 }));
  const result = await simulationService.run({ operation: "users", forceError: false });
  assert.deepEqual(Object.keys(result.layers), ["client", "api", "backend", "database"]);
  assert.deepEqual(result.data, { admin: 1, user: 2 });
  assert.equal(result.layers.client.durationMs, 0);
  assert.ok(result.totalMs >= 0);
  assert.equal(new SimulationResponseDto(result).layers.length, 4);
});

test("la simulación de endpoints y peticiones usa su modelo; forceError lanza 500", async () => {
  test.mock.method(MonitoredEndpoint, "findAll", async () => [{ method: "GET", path: "/api/users", name: "Usuarios", id: 1 }]);
  test.mock.method(RequestLog, "getSummary", async () => ({ total: 3 }));
  const endpoints = await simulationService.run({ operation: "endpoints", forceError: false });
  assert.deepEqual(endpoints.data, { total: 1, items: [{ method: "GET", path: "/api/users", name: "Usuarios" }] });
  assert.equal((await simulationService.run({ operation: "requests", forceError: false })).data.total, 3);
  await assert.rejects(simulationService.run({ operation: "users", forceError: true }), { statusCode: 500, message: /Fallo simulado/ });
});
