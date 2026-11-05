const test = require("node:test");
const assert = require("node:assert/strict");
const { ListUsersRequestDto, UserIdRequestDto, CreateUserRequestDto, UpdateUserRequestDto, ChangePasswordRequestDto } = require("../../dto/usuarios");

const MSG_ROL = "El rol debe ser admin o user";

test("CreateUserRequestDto solo acepta los roles admin y user (sin rol, user)", () => {
  const base = { name: "Ana", email: "a@b.com", password: "clave1234" };
  assert.equal(new CreateUserRequestDto(base).role, "user");
  assert.equal(new CreateUserRequestDto({ ...base, role: "admin" }).role, "admin");
  for (const role of ["superadmin", "Admin", "inactive", 5, {}]) {
    assert.deepEqual(new CreateUserRequestDto({ ...base, role }).validate(), [MSG_ROL], String(role));
    assert.throws(() => new CreateUserRequestDto({ ...base, role }).assertValid(), { statusCode: 400, message: MSG_ROL });
  }
  assert.deepEqual(new UpdateUserRequestDto({ id: "1", role: "Admin" }).validate(), [MSG_ROL]);
});

test("UpdateUserRequestDto valida el :id e ignora los campos no enviados", () => {
  const dto = new UpdateUserRequestDto({ id: "7", name: "Ana" });
  assert.deepEqual(dto.validate(), []);
  assert.deepEqual(dto.changes(), { name: "Ana", email: undefined, role: undefined });
  assert.equal(new UpdateUserRequestDto({ id: "abc", name: "Ana" }).validate().length, 1);
});

test("UserIdRequestDto y ChangePasswordRequestDto rechazan datos inválidos", () => {
  assert.equal(new UserIdRequestDto({ id: "0" }).validate().length, 1);
  assert.equal(new ChangePasswordRequestDto({ id: "x", password: "123" }).validate().length, 2);
  assert.equal(new ChangePasswordRequestDto({ id: "3", currentPassword: "vieja1", password: "nueva1" }).currentPassword, "vieja1");
});

test("ListUsersRequestDto usa 20 por defecto y no pasa de 100", () => {
  assert.deepEqual({ ...new ListUsersRequestDto({}) }, { page: 1, limit: 20 });
  assert.deepEqual({ ...new ListUsersRequestDto({ page: "0", limit: "999" }) }, { page: 1, limit: 100 });
});
