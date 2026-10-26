// Reglas de gestión de usuarios. Devuelve modelos User; el controlador arma la vista de respuesta.
const bcrypt = require("bcryptjs");
const User = require("../modelos/usuario");
const authService = require("./autenticacion");
const { HttpError, ROLES, SECURITY } = require("../configuracion");

async function findActiveOrFail(id) {
  const user = await User.findById(id);
  if (!user || !user.isActive()) throw HttpError.notFound("Usuario no encontrado");
  return user;
}

// 409 si el correo ya existe (también en cuentas eliminadas: el correo es único).
async function ensureEmailFree(email, ownId) {
  const other = await User.findByEmail(email);
  if (!other || other.id === ownId) return;
  throw HttpError.conflict(other.isActive() ? "El correo ya está registrado" : "El correo pertenece a una cuenta eliminada");
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

// Un usuario ve su propio perfil; el administrador ve cualquiera.
async function getById(id, requester) {
  if (requester.id !== id && !requester.isAdmin()) throw HttpError.forbidden();
  return findActiveOrFail(id);
}

// Los usuarios creados por un administrador quedan verificados.
async function create({ name, email, password, role }, requester) {
  await ensureEmailFree(email);

  const passwordHash = await bcrypt.hash(password, SECURITY.BCRYPT_ROUNDS);
  return User.create({ name, email, passwordHash, role, emailVerified: true, createdById: requester?.id ?? null });
}

async function update(id, changes, requester) {
  const user = await findActiveOrFail(id);
  if (requester?.id === id && changes.role !== undefined && changes.role !== user.role) {
    throw HttpError.badRequest("No puedes cambiar tu propio rol");
  }

  if (changes.email && changes.email !== user.email) await ensureEmailFree(changes.email, user.id);
  if (changes.role && changes.role !== ROLES.ADMIN) await ensureAnotherAdminExists(user);

  return User.update(id, changes);
}

// Para cambiar la propia contraseña hay que dar la actual. El administrador puede cambiar la de otros sin ella.
// Devuelve la sesión nueva si es la propia; null si la cambió un administrador a otro usuario.
async function changePassword(id, { currentPassword, password }, requester) {
  // Primero el permiso (403) y después la existencia (404).
  const isOwner = requester.id === id;
  if (!isOwner && !requester.isAdmin()) throw HttpError.forbidden();
  const user = await findActiveOrFail(id);

  if (isOwner) {
    const valid = currentPassword && (await bcrypt.compare(currentPassword, user.passwordHash));
    if (!valid) throw HttpError.badRequest("La contraseña actual no es correcta");
  }

  // token_version + 1 cierra todas las sesiones del usuario.
  const tokenVersion = user.tokenVersion + 1;
  await User.updatePassword(id, await bcrypt.hash(password, SECURITY.BCRYPT_ROUNDS), tokenVersion);

  // Si cambia la propia, devuelve una sesión nueva para seguir conectado en este dispositivo.
  if (isOwner) return authService.issueSession(await findActiveOrFail(id));
  return null;
}

// Eliminación lógica. Nadie puede eliminarse a sí mismo ni al último administrador.
async function remove(id, requester) {
  const user = await findActiveOrFail(id);
  if (requester.id === user.id) throw HttpError.badRequest("No puedes eliminar tu propio usuario");
  await ensureAnotherAdminExists(user);

  await User.softDelete(id);
}

module.exports = { list, getById, create, update, changePassword, remove };
