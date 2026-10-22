// Lógica de gestión de usuarios. Devuelve modelos User; el controlador arma el DTO de respuesta.
const bcrypt = require("bcryptjs");
const User = require("../modelos/usuario");
const HttpError = require("../utilidades/error-http");
const { ROLES } = require("../constantes/roles");
const { SECURITY } = require("../constantes/seguridad");

async function findActiveOrFail(id) {
  const user = await User.findById(id);
  if (!user || !user.isActive()) throw HttpError.notFound("Usuario no encontrado");
  return user;
}

async function list({ includeInactive, page, limit }) {
  const { users, total } = await User.findAll({ includeInactive, page, limit });
  return { users, total, page, limit };
}

async function getById(id) {
  return findActiveOrFail(id);
}

// Los usuarios creados por un administrador quedan verificados.
async function create({ name, email, password, role }, createdById) {
  if (await User.findByEmail(email)) throw HttpError.conflict("El correo ya está registrado");

  const passwordHash = await bcrypt.hash(password, SECURITY.BCRYPT_ROUNDS);
  return User.create({ name, email, passwordHash, role, emailVerified: true, createdById });
}

async function update(id, changes) {
  const user = await findActiveOrFail(id);

  if (changes.email && changes.email !== user.email) {
    const other = await User.findByEmail(changes.email);
    if (other && other.id !== user.id) throw HttpError.conflict("El correo ya está en uso");
  }

  return User.update(id, changes);
}

// Cada usuario cambia su propia contraseña; el administrador puede cambiar cualquiera.
async function changePassword(id, password, requester) {
  const user = await findActiveOrFail(id);
  const isOwner = Number(requester.id) === Number(user.id);
  if (!isOwner && requester.role !== ROLES.ADMIN) throw HttpError.forbidden();

  await User.updatePassword(id, await bcrypt.hash(password, SECURITY.BCRYPT_ROUNDS));
}

// Eliminación lógica. No se permite borrar usuarios demo ni el propio usuario.
async function remove(id, requester) {
  const user = await findActiveOrFail(id);
  if (user.isSample) throw HttpError.badRequest("Los usuarios demo no se pueden eliminar");
  if (Number(requester.id) === Number(user.id)) throw HttpError.badRequest("No puedes eliminar tu propio usuario");

  await User.softDelete(id);
}

module.exports = { list, getById, create, update, changePassword, remove };
