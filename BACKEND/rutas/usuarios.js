// reglas de gestión de usuarios
const bcrypt = require("bcryptjs");
const { User, UserAudit, Session } = require("../modelos");
const authService = require("./autenticacion");
const { HttpError, ROLES, SECURITY, quietly } = require("../config/configuracion");

// quien actúa queda en user_audit (sin quien actúa, como en crear-admin, no se guarda)
const audit = (requester, action, targetEmail, detail) =>
  requester ? void quietly(() => UserAudit.record({ userId: requester.id, action, targetEmail, detail })) : null;

async function findActiveOrFail(id) {
  const user = await User.findById(id);
  if (!user || !user.isActive()) throw HttpError.notFound("Usuario no encontrado");
  return user;
}

async function ensureEmailFree(email, ownId) {
  const other = await User.findByEmail(email);
  if (!other || other.id === ownId) return;
  throw HttpError.conflict(other.isActive() ? "El correo ya está registrado" : "El correo pertenece a una cuenta eliminada");
}

// no puede quedar el sistema sin administradores
async function ensureAnotherAdminExists(user) {
  if (!user.isAdmin()) return;
  const roles = await User.countByRole();
  if ((roles[ROLES.ADMIN] || 0) <= 1) throw HttpError.badRequest("Debe quedar al menos un administrador activo");
}

async function list({ page, limit }) {
  const { users, total } = await User.findPage({ page, limit });
  return { users, total, page, limit };
}

async function getById(id, requester) {
  if (requester.id !== id && !requester.isAdmin()) throw HttpError.forbidden();
  return findActiveOrFail(id);
}

async function create({ name, email, password, role }, requester) {
  await ensureEmailFree(email);

  const passwordHash = await bcrypt.hash(password, SECURITY.BCRYPT_ROUNDS);
  const user = await User.create({ name, email, passwordHash, role, emailVerified: true });
  audit(requester, "create", email, `rol ${role}`);
  return user;
}

async function update(id, changes, requester) {
  const user = await findActiveOrFail(id);
  if (requester?.id === id && changes.role !== undefined && changes.role !== user.role) {
    throw HttpError.badRequest("No puedes cambiar tu propio rol");
  }

  if (changes.email && changes.email !== user.email) await ensureEmailFree(changes.email, user.id);
  if (changes.role && changes.role !== ROLES.ADMIN) await ensureAnotherAdminExists(user);

  const updated = await User.update(id, changes);
  const changed = Object.keys(changes).filter((key) => changes[key] !== undefined);
  audit(requester, "update", user.email, `campos: ${changed.join(", ")}`);
  return updated;
}

// para cambiar la propia contraseña hay que dar la actual
async function changePassword(id, { currentPassword, password }, requester, client = {}) {
  // primero el permiso (403), después la existencia (404)
  const isOwner = requester.id === id;
  if (!isOwner && !requester.isAdmin()) throw HttpError.forbidden();
  const user = await findActiveOrFail(id);

  if (isOwner) {
    const valid = currentPassword && (await bcrypt.compare(currentPassword, user.passwordHash));
    if (!valid) throw HttpError.badRequest("La contraseña actual no es correcta");
  }

  // token_version + 1 cierra todas las sesiones
  const tokenVersion = user.tokenVersion + 1;
  await User.updatePassword(id, await bcrypt.hash(password, SECURITY.BCRYPT_ROUNDS), tokenVersion);

  void quietly(() => Session.revokeAll(id));
  if (isOwner) return authService.issueSession(await findActiveOrFail(id), client);
  audit(requester, "password", user.email, "contraseña cambiada por un administrador");
  return null;
}

// nadie se elimina a sí mismo ni al último administrador
async function remove(id, requester) {
  const user = await findActiveOrFail(id);
  if (requester.id === user.id) throw HttpError.badRequest("No puedes eliminar tu propio usuario");
  await ensureAnotherAdminExists(user);

  await User.softDelete(id);
  audit(requester, "delete", user.email, "cuenta eliminada");
}

Object.assign(module.exports, { list, getById, create, update, changePassword, remove });
