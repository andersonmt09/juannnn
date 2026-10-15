require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

(async () => {
  const host = process.env.DB_HOST || "localhost";
  const port = Number(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const dbName = process.env.DB_NAME || "axon_db";

  try {
    const conn = await mysql.createConnection({ host, port, user, password });
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.query(`USE \`${dbName}\``);
    const schemaPath = path.join(__dirname, "..", "..", "database", "schema.sql");
    // allow running from copied location too
    const altPath = path.join(process.cwd(), "database", "schema.sql");
    const sqlPath = fs.existsSync(schemaPath) ? schemaPath : altPath;
    const sql = fs.readFileSync(sqlPath, "utf8");
    // Split by semicolons but keep simple statements
    const statements = sql
      .split(/;\s*\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));
    for (const stmt of statements) {
      await conn.query(stmt);
    }
    await conn.end();
    console.log("[db:init] Base de datos y tablas creadas correctamente.");
  } catch (err) {
    console.error("[db:init] Error:", err.message);
    process.exit(1);
  }
})();
