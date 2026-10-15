// Genera, envía y valida los códigos de 6 dígitos (registro e inicio de sesión).
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const VerificationCode = require("../models/verification-code.model");
const emailService = require("./email.service");
const HttpError = require("../utils/http-error");
const { SECURITY } = require("../constants/security");

function generateCode() {
  return String(crypto.randomInt(0, 10 ** SECURITY.CODE_LENGTH)).padStart(SECURITY.CODE_LENGTH, "0");
}

// Invalida los códigos anteriores, crea uno nuevo y lo envía por correo.
async function issue({ userId, email, purpose }) {
  await VerificationCode.invalidateAll(email, purpose);

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, SECURITY.BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + SECURITY.CODE_EXPIRY_MINUTES * 60 * 1000);

  await VerificationCode.create({ userId, email, purpose, codeHash, expiresAt });
  await emailService.sendVerificationCode(email, code, purpose);
}

// Comprueba el código; si es correcto lo marca como usado.
async function verify({ email, purpose, code }) {
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

module.exports = { issue, verify, generateCode };
