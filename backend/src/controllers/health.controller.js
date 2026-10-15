/**
 * CONTROLADOR: Estado del servicio  →  /api/health
 * Indica si la API está activa y si la base de datos externa responde.
 */
const { testConnection } = require("../config/database");

async function check(req, res) {
  let database = "ok";
  try {
    await testConnection();
  } catch {
    database = "unreachable";
  }
  res.status(database === "ok" ? 200 : 503).json({ ok: database === "ok", service: "axon-api", database });
}

module.exports = { check };
