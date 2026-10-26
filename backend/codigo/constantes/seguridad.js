// Parámetros de seguridad: contraseñas, códigos de verificación, límite de intentos y paginación.
const SECURITY = Object.freeze({
  BCRYPT_ROUNDS: 10,
  PASSWORD_MIN_LENGTH: 6,

  CODE_LENGTH: 6,
  CODE_EXPIRY_MINUTES: 5,
  CODE_MAX_ATTEMPTS: 5,

  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
  RATE_LIMIT_MAX_ATTEMPTS: 5,
});

const PAGINATION = Object.freeze({
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
});

// Para qué se envió un código de verificación.
const CODE_PURPOSE = Object.freeze({
  LOGIN: "login",
  REGISTRATION: "registration",
});

module.exports = { SECURITY, PAGINATION, CODE_PURPOSE };
