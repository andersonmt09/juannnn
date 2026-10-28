// Configuración general del backend: variables de entorno (.env), constantes y utilidades compartidas.
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

// ---------- Variables de entorno ----------

// "false"/vacío -> false; un número -> ese número de saltos; "true" -> true; otro texto se pasa tal cual (IP o lista).
function parseTrustProxy(raw) {
  const value = String(raw || "").trim();
  if (!value || value.toLowerCase() === "false") return false;
  if (value.toLowerCase() === "true") return true;
  if (/^\d+$/.test(value)) return Number(value);
  return value;
}

const env = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || "development",

  // Proxies de confianza para leer la IP real (req.ip). Por defecto false: se ignora X-Forwarded-For.
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),

  // La base de datos es externa: el backend solo conoce la dirección de su API.
  databaseApi: {
    url: process.env.DATABASE_API_URL || "",
    key: process.env.DATABASE_API_KEY || "",
    timeoutMs: Number(process.env.DATABASE_API_TIMEOUT_MS) || 5000,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },

  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "AXON Security <no-reply@axon.local>",
  },
};

// Detiene el arranque si falta alguna variable obligatoria.
function validateEnvironment() {
  const missing = [];
  if (!/^https?:\/\//.test(env.databaseApi.url)) missing.push("DATABASE_API_URL (debe empezar por http:// o https://)");
  if (!env.databaseApi.key) missing.push("DATABASE_API_KEY");
  if (!env.jwt.secret || env.jwt.secret.length < 16) missing.push("JWT_SECRET (mínimo 16 caracteres)");
  if (!env.jwt.refreshSecret || env.jwt.refreshSecret.length < 16) missing.push("JWT_REFRESH_SECRET (mínimo 16 caracteres)");

  if (env.nodeEnv === "production" && !env.smtp.host) missing.push("SMTP_HOST (obligatorio en producción)");

  if (missing.length) {
    console.error("[env] Faltan variables de entorno:", missing.join(", "));
    console.error("      Copia backend/.env.example como backend/.env y complétalo.");
    process.exit(1);
  }
}

// ---------- Constantes ----------

// INACTIVE marca una cuenta eliminada de forma lógica.
const ROLES = Object.freeze({ ADMIN: "admin", USER: "user", INACTIVE: "inactive" });

const SECURITY = Object.freeze({
  BCRYPT_ROUNDS: 10,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 72, // bcrypt solo usa los primeros 72 bytes
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 255,
  EMAIL_MAX_LENGTH: 254,
  RESEND_COOLDOWN_MS: 30 * 1000,
  RESEND_MAX_PER_WINDOW: 5,
  CODE_LENGTH: 6,
  CODE_EXPIRY_MINUTES: 5,
  CODE_MAX_ATTEMPTS: 5,
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
  RATE_LIMIT_MAX_ATTEMPTS: 5,
});

const PAGINATION = Object.freeze({ DEFAULT_LIMIT: 20, MAX_LIMIT: 100 });

// Para qué se envió un código de verificación.
const CODE_PURPOSE = Object.freeze({ LOGIN: "login", REGISTRATION: "registration" });

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

// ---------- Errores HTTP ----------

// Los servicios lanzan HttpError y el middleware de errores lo convierte en respuesta.
class HttpError extends Error {
  // code: texto estable para que el frontend distinga casos; path y method los completa el 404.
  constructor(statusCode, message, details, code) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    if (details) this.details = details;
    if (code) this.code = code;
  }

  static badRequest(message, details) { return new HttpError(400, message, details); }
  static unauthorized(message = "No autenticado") { return new HttpError(401, message); }
  static forbidden(message = "Sin permisos para esta acción", code) { return new HttpError(403, message, undefined, code); }
  static notFound(message = "Recurso no encontrado") { return new HttpError(404, message); }
  static conflict(message) { return new HttpError(409, message); }
  static tooManyRequests(message = "Demasiados intentos. Intenta más tarde.") { return new HttpError(429, message); }
}

// Envuelve un controlador async para que sus errores lleguen al middleware de errores.
const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

// ---------- Validaciones ----------

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const isValidEmail = (value) => typeof value === "string" && value.length <= SECURITY.EMAIL_MAX_LENGTH && EMAIL_REGEX.test(value);
// Si no es texto devuelve "" (así nunca pasa la validación ni lanza error).
const normalizeEmail = (value) => (typeof value === "string" ? value.trim().toLowerCase() : "");
const isValidHttpMethod = (value) => HTTP_METHODS.includes(String(value || "").toUpperCase());
const isPositiveInteger = (value) => Number.isInteger(Number(value)) && Number(value) > 0;

// "/api/users/15?x=1" -> "/api/users/:id". Así se agrupan las peticiones por ruta.
const toRoutePattern = (url) => String(url || "").split("?")[0].replace(/\/\d+(?=\/|$)/g, "/:id");

module.exports = {
  env,
  validateEnvironment,
  ROLES,
  SECURITY,
  PAGINATION,
  CODE_PURPOSE,
  HTTP_METHODS,
  HttpError,
  asyncHandler,
  isValidEmail,
  normalizeEmail,
  isValidHttpMethod,
  isPositiveInteger,
  toRoutePattern,
};
