function validateEnv() {
  const required = ["JWT_SECRET", "JWT_REFRESH_SECRET"];
  const missing = required.filter((k) => !process.env[k] || process.env[k].length < 16);
  if (missing.length) {
    console.error("[env] Faltan variables de entorno requeridas o inseguras:", missing.join(", "));
    console.error("      Configura backend/.env antes de iniciar.");
    process.exit(1);
  }
  if (!process.env.DB_HOST) process.env.DB_HOST = "localhost";
  if (!process.env.DB_PORT) process.env.DB_PORT = "3306";
}
module.exports = { validateEnv };
