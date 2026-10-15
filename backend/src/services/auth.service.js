/**
 * SERVICIO: Autenticación.
 * Reglas de negocio de registro, login en dos pasos y renovación de sesión.
 * RF-01, RF-02, RF-03, RF-04, RF-05
 */
const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const verificationCodeService = require("./verification-code.service");
const tokenService = require("./token.service");
const HttpError = require("../utils/http-error");
const { UserResponseDto } = require("../dtos/user.dto");
const { ROLES } = require("../constants/roles");
const { SECURITY, CODE_PURPOSE } = require("../constants/security");

/** RF-01: registra un usuario y envía el código de verificación. */
async function register({ name, email, password }) {
  const existing = await User.findByEmail(email);
  if (existing) throw HttpError.conflict("El correo ya está registrado");

  const passwordHash = await bcrypt.hash(password, SECURITY.BCRYPT_ROUNDS);
  const user = await User.create({ name, email, passwordHash, role: ROLES.USER });

  await verificationCodeService.issue({ userId: user.id, email, purpose: CODE_PURPOSE.REGISTRATION });
  return { requiresVerification: true, email };
}

/** RF-02: confirma el correo con el código recibido. */
async function verifyRegistration({ email, code }) {
  await verificationCodeService.verify({ email, code, purpose: CODE_PURPOSE.REGISTRATION });
  await User.markEmailVerified(email);
  return { verified: true };
}

/** RF-03 (paso 1): valida credenciales y envía el código de acceso. */
async function login({ email, password }) {
  const user = await User.findByEmail(email);
  const validPassword = user && (await bcrypt.compare(password, user.passwordHash));
  if (!validPassword) throw HttpError.unauthorized("Credenciales incorrectas");
  if (!user.isActive()) throw HttpError.forbidden("La cuenta está desactivada");
  if (!user.emailVerified) throw HttpError.forbidden("Debes verificar tu correo electrónico primero");

  await verificationCodeService.issue({ userId: user.id, email, purpose: CODE_PURPOSE.LOGIN });
  return { requiresVerification: true, email };
}

/** RF-03 (paso 2): valida el código y entrega los tokens de sesión. */
async function verifyLogin({ email, code }) {
  await verificationCodeService.verify({ email, code, purpose: CODE_PURPOSE.LOGIN });

  const user = await User.findByEmail(email);
  if (!user || !user.isActive()) throw HttpError.unauthorized("Usuario no válido");

  return { ...tokenService.issueTokens(user), user: new UserResponseDto(user) };
}

/** RF-04: reenvía el código (login o registro). */
async function resendCode({ email, purpose }) {
  const user = await User.findByEmail(email);
  if (!user) throw HttpError.notFound("Usuario no encontrado");
  if (!user.isActive()) throw HttpError.forbidden("La cuenta está desactivada");
  if (purpose === CODE_PURPOSE.REGISTRATION && user.emailVerified) {
    throw HttpError.badRequest("El correo ya fue verificado");
  }

  await verificationCodeService.issue({ userId: user.id, email, purpose });
  return { message: "Código reenviado" };
}

/** RF-05: renueva la sesión con el refresh token. */
async function refreshSession({ refreshToken }) {
  const payload = tokenService.verifyRefreshToken(refreshToken);
  const user = await User.findById(payload.id);
  if (!user || !user.isActive()) throw HttpError.unauthorized("Usuario no válido");

  return { ...tokenService.issueTokens(user), user: new UserResponseDto(user) };
}

module.exports = { register, verifyRegistration, login, verifyLogin, resendCode, refreshSession };
