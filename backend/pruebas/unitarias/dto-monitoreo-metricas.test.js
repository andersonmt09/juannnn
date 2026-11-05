const test = require("node:test");
const assert = require("node:assert/strict");
const { CreateMonitoredEndpointRequestDto, MonitoredEndpointIdRequestDto } = require("../../dto/monitoreo");
const { ListRequestLogsRequestDto, RequestLogIdRequestDto } = require("../../dto/metricas");
const { RunSimulationRequestDto } = require("../../dto/simulacion");

test("CreateMonitoredEndpointRequestDto valida ruta /api/ y método HTTP", () => {
  const dto = new CreateMonitoredEndpointRequestDto({ name: "Login", path: "/api/auth/login", method: "post" });
  assert.equal(dto.method, "POST");
  assert.equal(dto.validate().length, 0);
  assert.equal(new CreateMonitoredEndpointRequestDto({ name: "X", path: "/otra", method: "FETCH" }).validate().length, 2);
});

test("los ids de endpoint y de petición deben ser enteros positivos", () => {
  const casos = [[MonitoredEndpointIdRequestDto, "-1", 1], [RequestLogIdRequestDto, "5", 0], [RequestLogIdRequestDto, "0", 1], [RequestLogIdRequestDto, "abc", 1]];
  for (const [Dto, id, errores] of casos) assert.equal(new Dto({ id }).validate().length, errores, `${Dto.name} ${id}`);
});

test("ListRequestLogsRequestDto: valores por defecto, límites y filtros", () => {
  const vacio = new ListRequestLogsRequestDto({});
  assert.deepEqual([vacio.page, vacio.limit], [1, 20]);
  assert.equal(new ListRequestLogsRequestDto({ limit: "999" }).limit, 100);
  assert.equal(new ListRequestLogsRequestDto({ page: "-3" }).page, 1);
  const ok = new ListRequestLogsRequestDto({ method: "get", statusClass: "4XX" });
  assert.deepEqual([ok.method, ok.statusClass, ok.validate()], ["GET", "4xx", []]);
  assert.equal(new ListRequestLogsRequestDto({ method: "FETCH" }).validate().length, 1);
  assert.equal(new ListRequestLogsRequestDto({ statusClass: "6xx" }).validate().length, 1);
});

test("RunSimulationRequestDto: users por defecto, forceError y operación válida", () => {
  const dto = new RunSimulationRequestDto({});
  assert.deepEqual([dto.operation, dto.forceError], ["users", false]);
  assert.equal(new RunSimulationRequestDto({ forceError: "true" }).forceError, true);
  assert.equal(new RunSimulationRequestDto({ forceError: "no" }).forceError, false);
  assert.deepEqual(new RunSimulationRequestDto({ operation: "Requests" }).validate(), []);
  assert.deepEqual(new RunSimulationRequestDto({ operation: "otra" }).validate(), ["La operación debe ser una de: users, endpoints, requests"]);
});
