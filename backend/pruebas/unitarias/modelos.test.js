const test = require("node:test");
const assert = require("node:assert/strict");
const User = require("../../modelos/usuario");
const RequestLog = require("../../modelos/registro-peticion");
const { hash } = require("./ayudantes");

test("User.validateCredentials: null si el correo no existe o la contraseña falla; User si es correcta", async () => {
  const row = { id: "15", name: "Ana", email: "ana@axon.com", role: "user", email_verified: true, password_hash: hash("clave123") };
  const find = test.mock.method(User, "findByEmail", async () => new User(row));
  assert.equal(await User.validateCredentials("ana@axon.com", "mala"), null);
  assert.equal((await User.validateCredentials("ana@axon.com", "clave123")).id, 15);
  assert.equal(find.mock.callCount(), 2);
  find.mock.restore();
  test.mock.method(User, "findByEmail", async () => null);
  assert.equal(await User.validateCredentials("nadie@axon.com", "x"), null);
});

test("User y RequestLog convierten ids de texto en números", () => {
  const u = new User({ id: "15", created_by_id: "3" });
  assert.deepEqual([u.id, u.createdById, u.tokenVersion], [15, 3, 0]);
  assert.equal(new RequestLog({ id: "4", user_id: "9" }).userId, 9);
  assert.equal(new RequestLog({ id: "4", user_id: null }).userId, null);
});
