// registro, inicio de sesión en dos pasos y renovación de sesión
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../modelos/usuario");
const VerificationCode = require("../modelos/codigo-verificacion");
const { mail, tokens } = require("../externos");
const { HttpError, ROLES, SECURITY, CODE_PURPOSE } = require("../configuracion");

async function register({ name, email, password }) {
  if (await User.findByEmail(email)) throw HttpError.conflict("El correo ya está registrado");

  const passwordHash = await bcrypt.hash(password, SECURITY.BCRYPT_ROUNDS);
  const user = await User.create({ name, email, passwordHash, role: ROLES.USER });

  await issueCode({ userId: user.id, email, purpose: CODE_PURPOSE.REGISTRATION });
  return { email };
}

async function verifyRegistration({ email, code }) {
  await verifyCode({ email, code, purpose: CODE_PURPOSE.REGISTRATION });
  const user = await User.findByEmail(email);
  if (user) await User.markEmailVerified(user.id);
}

async function validateCredentials({ email, password }) {
  const user = await User.validateCredentials(email, password);
  if (!user) throw HttpError.unauthorized("Credenciales incorrectas");
  if (!user.isActive()) throw HttpError.forbidden("La cuenta está desactivada");
  if (!user.emailVerified) throw HttpError.forbidden("Debes verificar tu correo electrónico primero", "EMAIL_NOT_VERIFIED");
  return user;
}

async function startLoginVerification(user) {
  await issueCode({ userId: user.id, email: user.email, purpose: CODE_PURPOSE.LOGIN });
  return { email: user.email };
}

async function verifyLogin({ email, code }) {
  await verifyCode({ email, code, purpose: CODE_PURPOSE.LOGIN });
  const user = ensureActive(await User.findByEmail(email));
  return issueSession(user);
}

// enfriamiento en memoria por correo y propósito
const lastResend = new Map();

function enforceResendCooldown(email, purpose) {
  const now = Date.now();
  for (const [key, time] of lastResend) {
    if (now - time >= SECURITY.RESEND_COOLDOWN_MS) lastResend.delete(key);
  }
  const key = `${purpose}:${email}`;
  if (lastResend.has(key)) throw HttpError.tooManyRequests("Espera unos segundos antes de pedir otro código");
  lastResend.set(key, now);
}

async function resendCode({ email, purpose }) {
  // se aplica exista o no el correo, para no revelarlo
  enforceResendCooldown(email, purpose);
  const user = await User.findByEmail(email);
  if (!user || !user.isActive()) return;
  if (purpose === CODE_PURPOSE.REGISTRATION && user.emailVerified) return;
  await issueCode({ userId: user.id, email, purpose });
}

function issueSession(user) {
  return { ...tokens.issue(user), user };
}

async function refreshSession({ refreshToken }) {
  const user = await findActiveUser(tokens.verifyRefresh(refreshToken));
  return issueSession(user);
}

async function authenticateToken(accessToken) {
  return findActiveUser(tokens.verifyAccess(accessToken));
}

function ensureActive(user) {
  if (!user || !user.isActive()) throw HttpError.unauthorized("La sesión ya no es válida");
  return user;
}

// si la versión no coincide, la sesión fue cerrada
async function findActiveUser({ id, ver }) {
  const user = ensureActive(await User.findById(id));
  if (user.tokenVersion !== ver) throw HttpError.unauthorized("La sesión ya no es válida");
  return user;
}

function generateCode() {
  return String(crypto.randomInt(0, 10 ** SECURITY.CODE_LENGTH)).padStart(SECURITY.CODE_LENGTH, "0");
}

async function issueCode({ userId, email, purpose }) {
  await VerificationCode.invalidateAll(email, purpose);

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, SECURITY.BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + SECURITY.CODE_EXPIRY_MINUTES * 60 * 1000);

  await VerificationCode.create({ userId, email, purpose, codeHash, expiresAt });
  await mail.sendVerificationCode(email, code, purpose);
}

const INVALID_CODE_MESSAGE = "Código inválido o expirado";

async function verifyCode({ email, purpose, code }) {
  const record = await VerificationCode.findActive(email, purpose);
  if (!record) throw HttpError.unauthorized(INVALID_CODE_MESSAGE);

  // se cuenta el intento antes de comparar (por las peticiones en paralelo)
  const attempts = await VerificationCode.incrementAttempts(record.id);
  if (!Number.isFinite(attempts) || attempts > SECURITY.CODE_MAX_ATTEMPTS) {
    throw HttpError.tooManyRequests("Demasiados intentos para este código. Solicita uno nuevo.");
  }
  const matches = await bcrypt.compare(code, record.codeHash);
  if (!matches) throw HttpError.unauthorized(INVALID_CODE_MESSAGE);

  await VerificationCode.markUsed(record.id);
}

module.exports = {
  register,
  verifyRegistration,
  validateCredentials,
  startLoginVerification,
  verifyLogin,
  issueSession,
  resendCode,
  refreshSession,
  authenticateToken,
  generateCode,
};
