// Pruebas de los DTOs (no necesitan base de datos).
const test = require("node:test");
const assert = require("node:assert/strict");
const { LoginDto, RegisterDto, VerifyCodeDto } = require("../../codigo/dtos/entrada/autenticacion");
const { CreateUserDto, UpdateUserDto } = require("../../codigo/dtos/entrada/usuarios");
const { UserResponseDto } = require("../../codigo/dtos/salida/usuario");
const { CreateEndpointDto } = require("../../codigo/dtos/entrada/endpoints");

test("LoginDto normaliza el correo y exige contraseña", () => {
  const dto = new LoginDto({ email: "  ADMIN@Axon.com ", password: "" });
  assert.equal(dto.email, "admin@axon.com");
  assert.deepEqual(dto.validate(), ["La contraseña es obligatoria"]);
});

test("RegisterDto rechaza nombre corto y contraseña corta", () => {
  const errors = new RegisterDto({ name: "A", email: "a@b.com", password: "123" }).validate();
  assert.equal(errors.length, 2);
});

test("VerifyCodeDto exige exactamente 6 dígitos", () => {
  assert.equal(new VerifyCodeDto({ email: "a@b.com", code: "123456" }).validate().length, 0);
  assert.equal(new VerifyCodeDto({ email: "a@b.com", code: "12a456" }).validate().length, 1);
});

test("assertValid lanza error 400 con la lista de errores", () => {
  assert.throws(
    () => new CreateUserDto({ name: "", email: "x", password: "" }).assertValid(),
    (error) => error.statusCode === 400 && error.details.length === 3
  );
});

test("CreateUserDto solo acepta los roles admin y user", () => {
  assert.equal(new CreateUserDto({ role: "superadmin" }).role, "user");
  assert.equal(new CreateUserDto({ role: "admin" }).role, "admin");
});

test("UpdateUserDto ignora los campos no enviados", () => {
  const dto = new UpdateUserDto({ name: "Ana" });
  assert.equal(dto.email, undefined);
  assert.deepEqual(dto.validate(), []);
});

test("UserResponseDto nunca expone el hash de la contraseña", () => {
  const dto = new UserResponseDto({ id: 1, name: "Ana", email: "a@b.com", passwordHash: "secreto", role: "user" });
  assert.equal("passwordHash" in dto, false);
});

test("CreateEndpointDto valida ruta y método HTTP", () => {
  assert.equal(new CreateEndpointDto({ name: "X", path: "/api/x", method: "get" }).validate().length, 0);
  assert.equal(new CreateEndpointDto({ name: "X", path: "api", method: "FETCH" }).validate().length, 2);
});
