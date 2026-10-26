// Pruebas de las reglas de negocio de los servicios. Los modelos se reemplazan por dobles
// (mock), así que no se llama a la base de datos externa.
const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const User = require("../../codigo/modelos/usuario");
const MonitoredEndpoint = require("../../codigo/modelos/endpoint-monitoreado");
const RequestLog = require("../../codigo/modelos/registro-peticion");
const userService = require("../../codigo/servicios/usuarios");
const monitoringService = require("../../codigo/servicios/monitoreo");

const makeUser = (data) => new User({ email_verified: true, ...data });
const admin = makeUser({ id: 1, name: "Admin", email: "admin@axon.com", role: "admin" });
const ana = makeUser({ id: 2, name: "Ana", email: "ana@axon.com", role: "user", password_hash: bcrypt.hashSync("actual1", 4) });

test.afterEach(() => test.mock.restoreAll());

const usersById = (...users) => test.mock.method(User, "findById", async (id) => users.find((u) => u.id === id) || null);
const adminCount = (n) => test.mock.method(User, "countByRole", async () => ({ admin: n, user: 3 }));

// ---------- Usuarios ----------

test("no se puede eliminar al último administrador", async () => {
  const otherAdmin = makeUser({ id: 5, role: "admin" });
  usersById(otherAdmin);
  adminCount(1);
  const softDelete = test.mock.method(User, "softDelete", async () => {});

  await assert.rejects(userService.remove(5, admin), { statusCode: 400, message: /al menos un administrador/ });
  assert.equal(softDelete.mock.callCount(), 0);
});

test("se puede eliminar un administrador si queda otro", async () => {
  usersById(makeUser({ id: 5, role: "admin" }));
  adminCount(2);
  const softDelete = test.mock.method(User, "softDelete", async () => {});

  await userService.remove(5, admin);
  assert.equal(softDelete.mock.callCount(), 1);
});

test("nadie puede eliminarse a sí mismo", async () => {
  usersById(admin);
  await assert.rejects(userService.remove(1, admin), { statusCode: 400 });
});

test("quitarle el rol al último administrador no se permite", async () => {
  usersById(admin);
  adminCount(1);
  await assert.rejects(userService.update(1, { role: "user" }), { statusCode: 400 });
});

test("cambiar la contraseña propia exige la contraseña actual correcta", async () => {
  usersById(ana);
  const updatePassword = test.mock.method(User, "updatePassword", async () => {});

  await assert.rejects(userService.changePassword(2, { currentPassword: "otra", password: "nueva12" }, ana), { statusCode: 400 });
  await assert.rejects(userService.changePassword(2, { password: "nueva12" }, ana), { statusCode: 400 });
  await userService.changePassword(2, { currentPassword: "actual1", password: "nueva12" }, ana);
  assert.equal(updatePassword.mock.callCount(), 1);
});

test("el administrador cambia la contraseña de otro sin la actual; un usuario común no puede", async () => {
  const luis = makeUser({ id: 3, role: "user" });
  usersById(ana, luis);
  test.mock.method(User, "updatePassword", async () => {});

  await userService.changePassword(2, { password: "nueva12" }, admin);
  await assert.rejects(userService.changePassword(3, { password: "nueva12" }, ana), { statusCode: 403 });
});

test("no se permite cambiar el correo por uno que ya usa otra cuenta", async () => {
  usersById(ana);
  test.mock.method(User, "findByEmail", async () => admin);
  await assert.rejects(userService.update(2, { email: "admin@axon.com" }), { statusCode: 409 });
});

// ---------- Monitoreo ----------

const apiRoutes = [{ method: "POST", path: "/api/auth/login" }, { method: "GET", path: "/api/users" }];

test("solo se pueden monitorear rutas que existen en la API", async () => {
  await assert.rejects(
    monitoringService.create({ name: "X", method: "GET", path: "/api/no-existe" }, apiRoutes),
    { statusCode: 400 }
  );
});

test("no se puede monitorear dos veces el mismo endpoint", async () => {
  test.mock.method(MonitoredEndpoint, "findAll", async () => [{ id: 1, method: "POST", path: "/api/auth/login" }]);
  await assert.rejects(
    monitoringService.create({ name: "Login", method: "POST", path: "/api/auth/login" }, apiRoutes),
    { statusCode: 409 }
  );
});

test("la lista de monitoreo cruza cada endpoint con sus estadísticas", async () => {
  test.mock.method(MonitoredEndpoint, "findAll", async () => [
    { id: 1, method: "POST", path: "/api/auth/login" },
    { id: 2, method: "GET", path: "/api/users" },
  ]);
  test.mock.method(RequestLog, "getStatsByRoute", async () => [
    { method: "POST", route: "/api/auth/login", total: 10, errors: 3, avgLatencyMs: 40, lastRequestAt: null },
  ]);

  const [login, users] = await monitoringService.list();
  assert.equal(login.stats.total, 10);
  assert.equal(users.stats, undefined);
});
