/**
 * SERVICIO: Gestión de usuarios.
 * RF-06, RF-07, RF-08, RF-09, RF-10
 */
const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const HttpError = require("../utils/http-error");
const { UserResponseDto } = require("../dtos/user.dto");
const { ROLES } = require("../constants/roles");
const { SECURITY } = require("../constants/security");

async function findActiveOrFail(id) {
  const user = await User.findById(id);
  if (!user || !user.isActive()) throw HttpError.notFound("Usuario no encontrado");
  return user;
}

/** RF-06: lista usuarios con paginación. */
async function list({ includeInactive, page, limit }) {
  const { users, total } = await User.findAll({ includeInactive, page, limit });
  return { users: users.map((u) => new UserResponseDto(u)), meta: { total, page, limit } };
}

/** RF-06: consulta un usuario. */
async function getById(id) {
  return new UserResponseDto(await findActiveOrFail(id));
}

/** RF-07: el administrador crea un usuario (ya verificado). */
async function create({ name, email, password, role }, createdById) {
  if (await User.findByEmail(email)) throw HttpError.conflict("El correo ya está registrado");

  const passwordHash = await bcrypt.hash(password, SECURITY.BCRYPT_ROUNDS);
  const user = await User.create({ name, email, passwordHash, role, emailVerified: true, createdById });
  return new UserResponseDto(user);
}

/** RF-08: el administrador edita nombre, correo o rol. */
async function update(id, changes) {
  const user = await findActiveOrFail(id);

  if (changes.email && changes.email !== user.email) {
    const other = await User.findByEmail(changes.email);
    if (other && other.id !== user.id) throw HttpError.conflict("El correo ya está en uso");
  }

  return new UserResponseDto(await User.update(id, changes));
}

/** RF-09: cambio de contraseña (el propio usuario o un administrador). */
async function changePassword(id, { password }, requester) {
  const user = await findActiveOrFail(id);
  const isOwner = Number(requester.id) === Number(user.id);
  if (!isOwner && requester.role !== ROLES.ADMIN) throw HttpError.forbidden();

  await User.updatePassword(id, await bcrypt.hash(password, SECURITY.BCRYPT_ROUNDS));
  return { message: "Contraseña actualizada" };
}

/** RF-10: eliminación lógica, con usuarios demo y propio usuario protegidos. */
async function remove(id, requester) {
  const user = await findActiveOrFail(id);
  if (user.isSample) throw HttpError.badRequest("Los usuarios demo no se pueden eliminar");
  if (Number(requester.id) === Number(user.id)) throw HttpError.badRequest("No puedes eliminar tu propio usuario");

  await User.softDelete(id);
  return { message: "Usuario eliminado" };
}

module.exports = { list, getById, create, update, changePassword, remove };
