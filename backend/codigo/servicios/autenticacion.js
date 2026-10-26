// Lógica de registro, inicio de sesión en dos pasos, renovación de sesión y validación del token.
// Devuelve datos del dominio; el controlador los convierte en el DTO de respuesta.
const bcrypt = require("bcryptjs");
const User = require("../modelos/usuario");
const verificationCodeService = require("./codigos-verificacion");
const tokenService = require("../integraciones/tokens");
const HttpError = require("../utilidades/error-http");
const { ROLES } = require("../constantes/roles");
const { SECURITY, CODE_PURPOSE } = require("../constantes/seguridad");

async function register({ name, email, password }) {
  if (await User.findByEmail(email)) throw HttpError.conflict("El correo ya está registrado");

  const passwordHash = await bcrypt.hash(password, SECURITY.BCRYPT_ROUNDS);
  const user = await User.create({ name, email, passwordHash, role: ROLES.USER });

  await verificationCodeService.issue({ userId: user.id, email, purpose: CODE_PURPOSE.REGISTRATION });
  return { email };
}

async function verifyRegistration({ email, code }) {
  await verificationCodeService.verify({ email, code, purpose: CODE_PURPOSE.REGISTRATION });
  const user = await User.findByEmail(email);
  if (user) await User.markEmailVerified(user.id);
}

// Paso 1: valida correo y contraseña y envía el código al correo.
async function login({ email, password }) {
  const user = await User.findByEmail(email);
  const validPassword = user && (await bcrypt.compare(password, user.passwordHash));
  if (!validPassword) throw HttpError.unauthorized("Credenciales incorrectas");
  if (!user.isActive()) throw HttpError.forbidden("La cuenta está desactivada");
  if (!user.emailVerified) throw HttpError.forbidden("Debes verificar tu correo electrónico primero");

  await verificationCodeService.issue({ userId: user.id, email, purpose: CODE_PURPOSE.LOGIN });
  return { email };
}

// Paso 2: valida el código y entrega los tokens.
async function verifyLogin({ email, code }) {
  await verificationCodeService.verify({ email, code, purpose: CODE_PURPOSE.LOGIN });
  const user = ensureActive(await User.findByEmail(email));
  return { ...tokenService.issueTokens(user), user };
}

async function resendCode({ email, purpose }) {
  const user = await User.findByEmail(email);
  if (!user) throw HttpError.notFound("Usuario no encontrado");
  if (!user.isActive()) throw HttpError.forbidden("La cuenta está desactivada");
  if (purpose === CODE_PURPOSE.REGISTRATION && user.emailVerified) {
    throw HttpError.badRequest("El correo ya fue verificado");
  }
  await verificationCodeService.issue({ userId: user.id, email, purpose });
}

async function refreshSession({ refreshToken }) {
  const user = await findActiveUser(tokenService.verifyRefreshToken(refreshToken));
  return { ...tokenService.issueTokens(user), user };
}

// Lo usa middlewares/autenticacion.js en cada petición: un usuario desactivado pierde el acceso de inmediato.
async function authenticateToken(accessToken) {
  return findActiveUser(tokenService.verifyAccessToken(accessToken));
}

// ---------- Apoyo ----------

function ensureActive(user) {
  if (!user || !user.isActive()) throw HttpError.unauthorized("La sesión ya no es válida");
  return user;
}

async function findActiveUser(id) {
  return ensureActive(await User.findById(id));
}

module.exports = { register, verifyRegistration, login, verifyLogin, resendCode, refreshSession, authenticateToken };
