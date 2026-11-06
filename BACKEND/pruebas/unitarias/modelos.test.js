const test = require("node:test");
const assert = require("node:assert/strict");
const User = require("../../modelos/usuarios_modelo");
const RequestLog = require("../../modelos/registros_peticiones_modelo");
const catalogs = require("../../modelos");
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

// catálogos con datos fijos (sin base de datos)
const fijarCatalogo = (catalogo, pares) => {
  catalogo.loading = Promise.resolve({
    ids: new Map(pares.map(([valor, id]) => [String(valor), id])),
    values: new Map(pares.map(([valor, id]) => [id, valor])),
  });
};

test("User y RequestLog convierten ids de texto en números", () => {
  const u = new User({ id: "15" });
  assert.deepEqual([u.id, u.tokenVersion], [15, 0]);
  assert.equal(new RequestLog({ id: "4", user_id: "9" }).userId, 9);
  assert.equal(new RequestLog({ id: "4", user_id: null }).userId, null);
});

test("User.fromRow traduce role_id y status_id: admin, user o inactive", async () => {
  fijarCatalogo(catalogs.roles, [["admin", 1], ["user", 2]]);
  fijarCatalogo(catalogs.userStatuses, [["active", 1], ["inactive", 2]]);
  assert.equal((await User.fromRow({ id: 1, role_id: 1, status_id: 1 })).role, "admin");
  assert.equal((await User.fromRow({ id: 2, role_id: 2, status_id: 1 })).role, "user");
  const borrado = await User.fromRow({ id: 3, role_id: 1, status_id: 2 });
  assert.deepEqual([borrado.role, borrado.isActive()], ["inactive", false]);
  assert.equal(await User.fromRow(null), null);
});

test("RequestLog.fromRow traduce status_code_id al código HTTP; el catálogo traduce nombre e id", async () => {
  fijarCatalogo(catalogs.httpStatusCodes, [[200, 1], [404, 2]]);
  assert.equal((await RequestLog.fromRow({ id: 1, status_code_id: 2 })).statusCode, 404);
  assert.equal(await catalogs.httpStatusCodes.idOf(200), 1);
  await assert.rejects(catalogs.httpStatusCodes.idOf(999), { statusCode: 502 });
});
