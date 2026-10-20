// Variables de entorno (backend/.env). El resto del código lee la configuración desde aquí.
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

const env = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || "development",
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5500,http://127.0.0.1:5500",

  // La base de datos es externa: aquí solo están los datos de conexión.
  database: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || "",
    name: process.env.DB_NAME,
    ssl: process.env.DB_SSL === "true",
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
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
  if (!env.database.host) missing.push("DB_HOST");
  if (!env.database.user) missing.push("DB_USER");
  if (!env.database.name) missing.push("DB_NAME");
  if (!env.jwt.secret || env.jwt.secret.length < 16) missing.push("JWT_SECRET (mínimo 16 caracteres)");
  if (!env.jwt.refreshSecret || env.jwt.refreshSecret.length < 16) missing.push("JWT_REFRESH_SECRET (mínimo 16 caracteres)");

  if (missing.length) {
    console.error("[env] Faltan variables de entorno:", missing.join(", "));
    console.error("      Copia backend/.env.example como backend/.env y complétalo.");
    process.exit(1);
  }
}

module.exports = { env, validateEnvironment };
