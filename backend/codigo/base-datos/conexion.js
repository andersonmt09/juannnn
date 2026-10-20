// Pool de conexiones a la base de datos MySQL externa. Solo lo usan los modelos.
const mysql = require("mysql2/promise");
const { env } = require("../configuracion/entorno");

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

// Verifica que el servidor de base de datos responde.
async function testConnection() {
  const connection = await pool.getConnection();
  await connection.ping();
  connection.release();
}

// Cierra todas las conexiones (al apagar el servidor).
async function closeConnection() {
  await pool.end();
}

module.exports = { pool, testConnection, closeConnection };
