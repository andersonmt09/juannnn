// Reglas de registro, inicio de sesión en dos pasos (contraseña + código al correo), renovación de sesión
// y validación del token. Devuelve datos del dominio; el controlador los convierte en la vista de respuesta.
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../modelos/usuario");
const VerificationCode = require("../modelos/codigo-verificacion");
const { mail, tokens } = require("../externos");
const { HttpError, ROLES, SECURITY, CODE_PURPOSE } = require("../configuracion");

// ---------- Registro ----------

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

// ---------- Inicio de sesión ----------

// validarCredenciales(usu, contra): consulta al Modelo y aplica las reglas de la cuenta.
async function validateCredentials({ email, password }) {
  const user = await User.validateCredentials(email, password);
  if (!user) throw HttpError.unauthorized("Credenciales incorrectas");
  if (!user.isActive()) throw HttpError.forbidden("La cuenta está desactivada");
  if (!user.emailVerified) throw HttpError.forbidden("Debes verificar tu correo electrónico primero", "EMAIL_NOT_VERIFIED");
  return user;
}

// Paso 1 (después de validar): envía el código al correo.
async function startLoginVerification(user) {
  await issueCode({ userId: user.id, email: user.email, purpose: CODE_PURPOSE.LOGIN });
  return { email: user.email };
}

async function login(credentials) {
  return startLoginVerification(await validateCredentials(credentials));
}

// Paso 2: valida el código y entrega los tokens.
async function verifyLogin({ email, code }) {
  await verifyCode({ email, code, purpose: CODE_PURPOSE.LOGIN });
  const user = ensureActive(await User.findByEmail(email));
  return issueSession(user);
}

async function resendCode({ email, purpose }) {
  // Respuesta genérica: no revela si el correo existe, está desactivado o ya verificado.
  const user = await User.findByEmail(email);
  if (!user || !user.isActive()) return;
  if (purpose === CODE_PURPOSE.REGISTRATION && user.emailVerified) return;
  await issueCode({ userId: user.id, email, purpose });
}

// ---------- Recuperar contraseña ----------

// Respuesta siempre genérica: si no existe, está inactivo o sin verificar, no hace nada.
async function requestPasswordReset({ email }) {
  const user = await User.findByEmail(email);
  if (!user || !user.isActive() || !user.emailVerified) return;
  await issueCode({ userId: user.id, email, purpose: CODE_PURPOSE.PASSWORD_RESET });
}

// Comprueba el código, guarda la contraseña nueva y cierra todas las sesiones (token_version + 1).
async function resetPassword({ email, code, password }) {
  await verifyCode({ email, code, purpose: CODE_PURPOSE.PASSWORD_RESET });
  const user = await User.findByEmail(email);
  if (!user || !user.isActive()) throw HttpError.unauthorized("Código inválido o expirado");

  const passwordHash = await bcrypt.hash(password, SECURITY.BCRYPT_ROUNDS);
  await User.updatePassword(user.id, passwordHash, user.tokenVersion + 1);
  await VerificationCode.invalidateAll(email, CODE_PURPOSE.LOGIN);
}

// ---------- Sesión ----------

// Entrega tokens nuevos con la versión actual del usuario.
function issueSession(user) {
  return { ...tokens.issue(user), user };
}

async function refreshSession({ refreshToken }) {
  const user = await findActiveUser(tokens.verifyRefresh(refreshToken));
  return issueSession(user);
}

// Lo usa el middleware authenticate en cada petición: un usuario desactivado pierde el acceso de inmediato.
async function authenticateToken(accessToken) {
  return findActiveUser(tokens.verifyAccess(accessToken));
}

function ensureActive(user) {
  if (!user || !user.isActive()) throw HttpError.unauthorized("La sesión ya no es válida");
  return user;
}

// { id, ver } viene del token: si la versión no coincide, la sesión fue cerrada (cambio de contraseña).
async function findActiveUser({ id, ver }) {
  const user = ensureActive(await User.findById(id));
  if (user.tokenVersion !== ver) throw HttpError.unauthorized("La sesión ya no es válida");
  return user;
}

// ---------- Códigos de verificación (6 dígitos) ----------

function generateCode() {
  return String(crypto.randomInt(0, 10 ** SECURITY.CODE_LENGTH)).padStart(SECURITY.CODE_LENGTH, "0");
}

// Invalida los códigos anteriores, crea uno nuevo y lo envía por correo.
async function issueCode({ userId, email, purpose }) {
  await VerificationCode.invalidateAll(email, purpose);

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, SECURITY.BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + SECURITY.CODE_EXPIRY_MINUTES * 60 * 1000);

  await VerificationCode.create({ userId, email, purpose, codeHash, expiresAt });
  await mail.sendVerificationCode(email, code, purpose);
}

// Comprueba el código; si es correcto lo marca como usado.
async function verifyCode({ email, purpose, code }) {
  const record = await VerificationCode.findActive(email, purpose);
  if (!record) throw HttpError.unauthorized("Código inválido o expirado");
  if (record.attempts >= SECURITY.CODE_MAX_ATTEMPTS) {
    throw HttpError.tooManyRequests("Demasiados intentos para este código. Solicita uno nuevo.");
  }

  await VerificationCode.incrementAttempts(record.id);
  const matches = await bcrypt.compare(code, record.codeHash);
  if (!matches) throw HttpError.unauthorized("Código incorrecto");

  await VerificationCode.markUsed(record.id);
}

module.exports = {
  register,
  verifyRegistration,
  validateCredentials,
  startLoginVerification,
  login,
  verifyLogin,
  requestPasswordReset,
  resetPassword,
  issueSession,
  resendCode,
  refreshSession,
  authenticateToken,
  generateCode,
};
