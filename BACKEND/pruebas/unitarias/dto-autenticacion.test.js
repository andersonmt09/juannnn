const test = require("node:test");
const assert = require("node:assert/strict");
const { CredentialsRequestDto, RegisterRequestDto, VerifyCodeRequestDto, CreateUserRequestDto } = require("../../esquemas/DTOs_Usuarios_Autenticacion");

test("CredentialsRequestDto normaliza el correo, exige contraseña y no existe LoginRequestDto", () => {
  const dto = new CredentialsRequestDto({ email: "  ADMIN@Axon.com ", password: "" });
  assert.equal(dto.email, "admin@axon.com");
  assert.deepEqual(dto.validate(), ["La contraseña es obligatoria"]);
  assert.deepEqual(new CredentialsRequestDto({ email: " A@B.com ", password: "x" }).validate(), []);
  assert.equal(require("../../esquemas/DTOs_Usuarios_Autenticacion").LoginRequestDto, undefined);
  assert.equal(require("../../rutas/autenticacion").login, undefined);
});

test("RegisterRequestDto: nombre corto, contraseña de 8 a 72 caracteres, correo con coma", () => {
  const registro = (extra) => new RegisterRequestDto({ name: "Ana", email: "a@b.com", password: "12345678", ...extra }).validate().length;
  assert.equal(new RegisterRequestDto({ name: "A", email: "a@b.com", password: "123" }).validate().length, 2);
  const casos = [
    [{ password: "1234567" }, 1],
    [{ password: "12345678" }, 0],
    [{ password: "a".repeat(72) }, 0],
    [{ password: "a".repeat(73) }, 1],
    [{ password: { $ne: 1 } }, 1],
    [{ email: "a@b.com,c@d.com" }, 1],
  ];
  for (const [extra, errores] of casos) assert.equal(registro(extra), errores, JSON.stringify(extra));
});

test("VerifyCodeRequestDto exige exactamente 6 dígitos", () => {
  for (const [code, errores] of [["123456", 0], ["12a456", 1]]) {
    assert.equal(new VerifyCodeRequestDto({ email: "a@b.com", code }).validate().length, errores, code);
  }
});

test("assertValid lanza error 400 con la lista de errores", () => {
  assert.throws(
    () => new CreateUserRequestDto({ name: "", email: "x", password: "" }).assertValid(),
    (error) => error.statusCode === 400 && error.details.length === 3
  );
});
