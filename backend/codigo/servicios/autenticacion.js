// Lógica de registro, inicio de sesión en dos pasos y renovación de sesión.
// Devuelve datos del dominio; el controlador los convierte en el DTO de respuesta.
const bcrypt = require("bcryptjs");
const User = require("../modelos/usuario");
const verificationCodeService = require("./apoyo/codigos-verificacion");
const tokenService = require("../integraciones/tokens");
const HttpError = require("../utilidades/error-http");
const { ROLES } = require("../constantes/roles");
const { SECURITY, CODE_PURPOSE } = require("../constantes/seguridad");

async function register({ name, email, password }) {
  const existing = await User.findByEmail(email);
  if (existing) throw HttpError.conflict("El correo ya está registrado");

  const passwordHash = await bcrypt.hash(password, SECURITY.BCRYPT_ROUNDS);
  const user = await User.create({ name, email, passwordHash, role: ROLES.USER });

  await verificationCodeService.issue({ userId: user.id, email, purpose: CODE_PURPOSE.REGISTRATION });
  return { email };
}

async function verifyRegistration({ email, code }) {
  await verificationCodeService.verify({ email, code, purpose: CODE_PURPOSE.REGISTRATION });
  await User.markEmailVerified(email);
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

  const user = await User.findByEmail(email);
  if (!user || !user.isActive()) throw HttpError.unauthorized("Usuario no válido");

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
  const payload = tokenService.verifyRefreshToken(refreshToken);
  const user = await User.findById(payload.id);
  if (!user || !user.isActive()) throw HttpError.unauthorized("Usuario no válido");

  return { ...tokenService.issueTokens(user), user };
}

module.exports = { register, verifyRegistration, login, verifyLogin, resendCode, refreshSession };
