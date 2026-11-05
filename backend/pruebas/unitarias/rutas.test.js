const test = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const { requestLogger } = require("../../middlewares/registro-peticiones");
const { listApiRoutes } = require("../../controladores");
const RequestLog = require("../../modelos/registro-peticion");
require("./ayudantes");

function fakeRequest(url, notFound = false) {
  const res = new EventEmitter();
  res.statusCode = notFound ? 404 : 200;
  res.locals = notFound ? { notFound: true } : {};
  requestLogger({ method: "GET", originalUrl: url, ip: "1.2.3.4", user: null }, res, () => {});
  res.emit("finish");
}

test("listApiRoutes no incluye /api/events/stream pero sí otras rutas", () => {
  const routes = listApiRoutes();
  assert.ok(!routes.some((r) => r.path === "/api/events/stream"));
  assert.ok(routes.some((r) => r.method === "POST" && r.path === "/api/auth/login"));
  assert.ok(routes.some((r) => r.path === "/api/events/ping"));
});

test("registro de peticiones: no guarda los 404 de rutas inexistentes ni el stream; sí el resto", () => {
  const create = test.mock.method(RequestLog, "create", async () => 1);
  fakeRequest("/api/no-existe", true);
  fakeRequest("/api/events/stream?token=abc");
  assert.equal(create.mock.callCount(), 0);
  fakeRequest("/api/users/5?x=1");
  assert.equal(create.mock.callCount(), 1);
  assert.equal(create.mock.calls[0].arguments[0].route, "/api/users/:id");
  assert.equal(create.mock.calls[0].arguments[0].path, "/api/users/5");
});
