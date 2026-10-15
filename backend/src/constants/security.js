// Parámetros de seguridad: contraseñas, códigos de verificación y límite de intentos.
const SECURITY = Object.freeze({
  BCRYPT_ROUNDS: 10,
  PASSWORD_MIN_LENGTH: 6,

  // Código de verificación por correo
  CODE_LENGTH: 6,
  CODE_EXPIRY_MINUTES: 5,
  CODE_MAX_ATTEMPTS: 5,

  // Límite de intentos por IP en autenticación
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
  RATE_LIMIT_MAX_ATTEMPTS: 5,
});

// Propósitos del código de verificación (columna login_verification_codes.purpose).
const CODE_PURPOSE = Object.freeze({
  LOGIN: "login",
  REGISTRATION: "registration",
});

module.exports = { SECURITY, CODE_PURPOSE };
