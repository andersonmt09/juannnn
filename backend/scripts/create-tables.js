/**
 * Crea las tablas en la base de datos EXTERNA ejecutando
 * docs/04-base-de-datos/script-creacion.sql con las credenciales de backend/.env.
 * Se ejecuta una sola vez. No hace falta tener el cliente "mysql" instalado.
 *
 * Uso:  npm run create-tables
 */
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const { env } = require("../src/config/environment");

const SCRIPT_PATH = path.join(__dirname, "..", "..", "docs", "04-base-de-datos", "script-creacion.sql");

async function main() {
  if (!env.database.host || !env.database.user) {
    console.error("Completa DB_HOST y DB_USER en backend/.env");
    process.exitCode = 1;
    return;
  }

  const sql = fs.readFileSync(SCRIPT_PATH, "utf8");
  const connection = await mysql.createConnection({
    host: env.database.host,
    port: env.database.port,
    user: env.database.user,
    password: env.database.password,
    ssl: env.database.ssl ? { rejectUnauthorized: true } : undefined,
    multipleStatements: true,
  });

  try {
    await connection.query(sql);
    const [tables] = await connection.query("SHOW TABLES FROM axon_db");
    console.log("Tablas listas en axon_db:", tables.map((t) => Object.values(t)[0]).join(", "));
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exitCode = 1;
});
