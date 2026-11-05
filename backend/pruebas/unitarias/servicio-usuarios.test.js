const test = require("node:test");
const assert = require("node:assert/strict");
const User = require("../../modelos/usuario");
const userService = require("../../servicios/usuarios");
const { makeUser, admin, ana, stub, usersById, adminCount } = require("./ayudantes");

const luis = makeUser({ id: 3, role: "user" });
const clave = { password: "nueva12" };

test("eliminar: no al último administrador, sí si queda otro, nunca a uno mismo", async () => {
  usersById(makeUser({ id: 5, role: "admin" }), admin);
  const { softDelete } = stub(User, { softDelete: undefined });
  const contar = adminCount(1);
  await assert.rejects(userService.remove(5, admin), { statusCode: 400, message: /al menos un administrador/ });
  assert.equal(softDelete.mock.callCount(), 0);
  contar.countByRole.mock.restore();
  adminCount(2);
  await userService.remove(5, admin);
  assert.equal(softDelete.mock.callCount(), 1);
  await assert.rejects(userService.remove(1, admin), { statusCode: 400 });
});

test("quitarle el rol al último administrador no se permite", async () => {
  usersById(admin);
  adminCount(1);
  await assert.rejects(userService.update(1, { role: "user" }), { statusCode: 400 });
});

test("cambiar la contraseña propia exige la contraseña actual correcta", async () => {
  usersById(ana);
  const { updatePassword } = stub(User, { updatePassword: undefined });
  await assert.rejects(userService.changePassword(2, { currentPassword: "otra", ...clave }, ana), { statusCode: 400 });
  await assert.rejects(userService.changePassword(2, clave, ana), { statusCode: 400 });
  await userService.changePassword(2, { currentPassword: "actual1", ...clave }, ana);
  assert.equal(updatePassword.mock.callCount(), 1);
});

test("el admin cambia la contraseña de otro sin la actual (incrementa tokenVersion, sin sesión); un usuario común no puede", async () => {
  usersById(makeUser({ id: 2, role: "user", token_version: 3 }), luis, ana);
  const { updatePassword } = stub(User, { updatePassword: undefined });
  assert.equal(await userService.changePassword(2, clave, admin), null);
  assert.equal(updatePassword.mock.calls[0].arguments[2], 4);
  await assert.rejects(userService.changePassword(3, clave, ana), { statusCode: 403 });
});

test("no se permite cambiar el correo por uno que ya usa otra cuenta", async () => {
  usersById(ana);
  stub(User, { findByEmail: admin });
  await assert.rejects(userService.update(2, { email: "admin@axon.com" }), { statusCode: 409 });
});

test("un administrador no puede cambiar su propio rol, pero sí otros datos y el rol de otros", async () => {
  usersById(admin, ana);
  adminCount(2);
  const { update } = stub(User, { update: admin });
  await assert.rejects(userService.update(1, { role: "user" }, admin), { statusCode: 400, message: "No puedes cambiar tu propio rol" });
  assert.equal(update.mock.callCount(), 0);
  await userService.update(1, { name: "Nuevo", role: "admin" }, admin);
  await userService.update(2, { role: "admin" }, admin);
  assert.equal(update.mock.callCount(), 2);
});

test("getById: el propio usuario y el admin pueden verlo; otro usuario 403; inexistente 404", async () => {
  usersById(ana, luis, admin);
  assert.equal((await userService.getById(2, ana)).id, 2);
  assert.equal((await userService.getById(2, admin)).id, 2);
  await assert.rejects(userService.getById(3, ana), { statusCode: 403 });
  await assert.rejects(userService.getById(99, admin), { statusCode: 404 });
});
