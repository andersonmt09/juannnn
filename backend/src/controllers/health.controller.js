// Estado de la API y de la conexión a la base de datos.
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
