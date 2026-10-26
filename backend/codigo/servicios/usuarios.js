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

// Impide dejar el sistema sin administradores activos.
async function ensureAnotherAdminExists(user) {
  if (!user.isAdmin()) return;
  const roles = await User.countByRole();
  if ((roles[ROLES.ADMIN] || 0) <= 1) throw HttpError.badRequest("Debe quedar al menos un administrador activo");
}

async function list({ page, limit }) {
  const { users, total } = await User.findPage({ page, limit });
  return { users, total, page, limit };
}

// Los usuarios creados por un administrador quedan verificados.
async function create({ name, email, password, role }, requester) {
  if (await User.findByEmail(email)) throw HttpError.conflict("El correo ya está registrado");

  const passwordHash = await bcrypt.hash(password, SECURITY.BCRYPT_ROUNDS);
  return User.create({ name, email, passwordHash, role, emailVerified: true, createdById: requester.id });
}

async function update(id, changes) {
  const user = await findActiveOrFail(id);

  if (changes.email && changes.email !== user.email) {
    const other = await User.findByEmail(changes.email);
    if (other && other.id !== user.id) throw HttpError.conflict("El correo ya está en uso");
  }
  if (changes.role && changes.role !== ROLES.ADMIN) await ensureAnotherAdminExists(user);

  return User.update(id, changes);
}

// Para cambiar la propia contraseña hay que dar la actual. El administrador puede cambiar la de otros sin ella.
async function changePassword(id, { currentPassword, password }, requester) {
  const user = await findActiveOrFail(id);
  const isOwner = requester.id === user.id;
  if (!isOwner && !requester.isAdmin()) throw HttpError.forbidden();

  if (isOwner) {
    const valid = currentPassword && (await bcrypt.compare(currentPassword, user.passwordHash));
    if (!valid) throw HttpError.badRequest("La contraseña actual no es correcta");
  }

  await User.updatePassword(id, await bcrypt.hash(password, SECURITY.BCRYPT_ROUNDS));
}

// Eliminación lógica. Nadie puede eliminarse a sí mismo ni al último administrador.
async function remove(id, requester) {
  const user = await findActiveOrFail(id);
  if (requester.id === user.id) throw HttpError.badRequest("No puedes eliminar tu propio usuario");
  await ensureAnotherAdminExists(user);

  await User.softDelete(id);
}

module.exports = { list, create, update, changePassword, remove };
