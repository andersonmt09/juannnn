/**
 * Conexión a la base de datos EXTERNA (MySQL).
 * La base de datos no vive dentro de este proyecto: se accede por red
 * con las credenciales definidas en backend/.env.
 * Solo los modelos (src/models) usan este pool.
 */
const mysql = require("mysql2/promise");
const { env } = require("./environment");

const pool = mysql.createPool({
  host: env.database.host,
  port: env.database.port,
  user: env.database.user,
  password: env.database.password,
  database: env.database.name,
  ssl: env.database.ssl ? { rejectUnauthorized: true } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "Z",
});

/** Verifica que el servidor de base de datos responde. */
async function testConnection() {
  const connection = await pool.getConnection();
  await connection.ping();
  connection.release();
}

/** Cierra todas las conexiones (al apagar el servidor). */
async function closeConnection() {
  await pool.end();
}

module.exports = { pool, testConnection, closeConnection };
