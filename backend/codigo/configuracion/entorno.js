// Variables de entorno (backend/.env). El resto del código lee la configuración desde aquí.
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

const env = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || "development",

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
    from: process.env.SMTP_FROM || "AXON <no-reply@axon.local>",
  },
};

// Detiene el arranque si falta alguna variable obligatoria.
function validateEnvironment() {
  const missing = [];
  if (!/^https?:\/\//.test(env.databaseApi.url)) missing.push("DATABASE_API_URL (debe empezar por http:// o https://)");
  if (!env.databaseApi.key) missing.push("DATABASE_API_KEY");
  if (!env.jwt.secret || env.jwt.secret.length < 16) missing.push("JWT_SECRET (mínimo 16 caracteres)");
  if (!env.jwt.refreshSecret || env.jwt.refreshSecret.length < 16) missing.push("JWT_REFRESH_SECRET (mínimo 16 caracteres)");

  if (missing.length) {
    console.error("[env] Faltan variables de entorno:", missing.join(", "));
    console.error("      Copia backend/.env.example como backend/.env y complétalo.");
    process.exit(1);
  }
}

module.exports = { env, validateEnvironment };
