// registro, inicio de sesión en dos pasos y renovación de sesión
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { User, VerificationCode, LoginAttempt, SentEmail, Session } = require("../modelos");
const { mail } = require("../config/correo");
const { tokens } = require("../config/seguridad");
const { HttpError, ROLES, SECURITY, CODE_PURPOSE, quietly } = require("../config/configuracion");

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

// client = { ipAddress, userAgent }; cada intento queda registrado
async function validateCredentials({ email, password }, client = {}) {
  const user = await User.validateCredentials(email, password);
  let failure = null;
  if (!user) failure = HttpError.unauthorized("Credenciales incorrectas");
  else if (!user.isActive()) failure = HttpError.forbidden("La cuenta está desactivada");
  else if (!user.emailVerified) failure = HttpError.forbidden("Debes verificar tu correo electrónico primero", "EMAIL_NOT_VERIFIED");

  // successful = la contraseña fue correcta (aunque la cuenta esté inactiva o sin verificar)
  // (si la clave falla, el usuario del correo se busca en segundo plano)
  void quietly(async () => {
    const owner = user || (await User.findByEmail(email));
    await LoginAttempt.record({ userId: owner?.id, email, ipAddress: client.ipAddress, successful: Boolean(user) });
  });
  if (failure) throw failure;
  return user;
}

async function startLoginVerification(user) {
  await issueCode({ userId: user.id, email: user.email, purpose: CODE_PURPOSE.LOGIN });
  return { email: user.email };
}

async function verifyLogin({ email, code }, client = {}) {
  await verifyCode({ email, code, purpose: CODE_PURPOSE.LOGIN });
  const user = ensureActive(await User.findByEmail(email));
  return issueSession(user, client);
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

// cada sesión nueva (login, renovación o cambio de clave propio) se registra
async function issueSession(user, client = {}) {
  const issued = tokens.issue(user);
  void quietly(() => Session.open({ userId: user.id, tokenVersion: user.tokenVersion, expiresAt: issued.expiresAt, ...client }));
  return { ...issued, user };
}

async function refreshSession({ refreshToken }, client = {}) {
  const user = await findActiveUser(tokens.verifyRefresh(refreshToken));
  return issueSession(user, client);
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

  const codeId = await VerificationCode.create({ userId, email, purpose, codeHash, expiresAt });
  const subject = await mail.sendVerificationCode(email, code, purpose);
  void quietly(() => SentEmail.record({ codeId, recipient: email, subject: subject || "Código de verificación" }));
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
