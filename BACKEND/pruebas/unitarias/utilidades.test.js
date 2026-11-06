const test = require("node:test");
const assert = require("node:assert/strict");
const { HttpError, isValidEmail, isValidHttpMethod, isPositiveInteger, toRoutePattern } = require("../../config/configuracion");
const { db } = require("../../config/base-datos");
require("./ayudantes");

test("validadores: correo, método HTTP y entero positivo", () => {
  const casos = [
    [isValidEmail, "ana@test.com", true], [isValidEmail, "ana@test", false],
    [isValidHttpMethod, "patch", true], [isValidHttpMethod, "OPTIONS", false],
    [isPositiveInteger, "12", true], [isPositiveInteger, "0", false], [isPositiveInteger, "abc", false],
  ];
  for (const [fn, entrada, esperado] of casos) assert.equal(fn(entrada), esperado, `${fn.name}(${entrada})`);
});

test("toRoutePattern quita la query y cambia los ids por :id", () => {
  const casos = {
    "/api/users?page=2": "/api/users",
    "/api/users/15": "/api/users/:id",
    "/api/users/15/password": "/api/users/:id/password",
    "/api/monitoring/endpoints/3": "/api/monitoring/endpoints/:id",
  };
  for (const [entrada, esperado] of Object.entries(casos)) assert.equal(toRoutePattern(entrada), esperado);
});

test("HttpError conserva el código HTTP y admite un code estable", () => {
  assert.equal(HttpError.conflict("x").statusCode, 409);
  assert.equal(HttpError.unauthorized().statusCode, 401);
  assert.equal(new HttpError(400, "x", undefined, "ABC").code, "ABC");
  const error = HttpError.forbidden("Verifica", "EMAIL_NOT_VERIFIED");
  assert.deepEqual([error.statusCode, error.code], [403, "EMAIL_NOT_VERIFIED"]);
  assert.equal(HttpError.notFound().code, undefined);
});

test("un 409 de la API externa da 409 'El recurso ya existe'; otros errores, 502 genérico", async () => {
  const reply = (status, body) => test.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify(body), { status }));
  reply(409, { message: "duplicate key secreto" });
  await assert.rejects(db.post("/users", {}), { statusCode: 409, message: "El recurso ya existe" });
  test.mock.restoreAll();
  reply(500, { message: "SQL interno" });
  await assert.rejects(db.get("/users"), (e) => e.statusCode === 502 && !/SQL/.test(e.message));
});
