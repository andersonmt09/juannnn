const test = require("node:test");
const assert = require("node:assert/strict");
const { CreateUserDTO, LoginDTO } = require("../src/dto/userDTO");

test("CreateUserDTO valida nombre corto", () => {
  const dto = new CreateUserDTO({ name: "A", email: "a@b.com", password: "123456" });
  const r = dto.validate();
  assert.equal(r.isValid, false);
  assert.ok(r.errors.some((e) => /nombre/i.test(e)));
});

test("CreateUserDTO acepta datos válidos", () => {
  const dto = new CreateUserDTO({ name: "Ana", email: "ana@test.com", password: "secret1" });
  const r = dto.validate();
  assert.equal(r.isValid, true);
});

test("LoginDTO requiere password", () => {
  const dto = new LoginDTO({ email: "a@b.com", password: "" });
  assert.equal(dto.validate().isValid, false);
});