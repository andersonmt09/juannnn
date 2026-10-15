// Pruebas de utilidades.
const test = require("node:test");
const assert = require("node:assert/strict");
const { isValidEmail, isValidHttpMethod, isPositiveInteger } = require("../../src/utils/validators");
const HttpError = require("../../src/utils/http-error");
const { generateCode } = require("../../src/services/verification-code.service");

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

test("HttpError conserva el código HTTP", () => {
  assert.equal(HttpError.conflict("x").statusCode, 409);
  assert.equal(HttpError.unauthorized().statusCode, 401);
});

test("generateCode produce 6 dígitos", () => {
  for (let i = 0; i < 50; i++) assert.match(generateCode(), /^\d{6}$/);
});
