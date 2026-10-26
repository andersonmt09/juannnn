// Pruebas de utilidades.
const test = require("node:test");
const assert = require("node:assert/strict");
const { isValidEmail, isValidHttpMethod, isPositiveInteger, toRoutePattern } = require("../../codigo/utilidades/validaciones");
const HttpError = require("../../codigo/utilidades/error-http");
const { generateCode } = require("../../codigo/servicios/codigos-verificacion");

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
  for (let i = 0; i < 50; i++) assert.match(generateCode(), /^\d{6}$/);
});
