// Estado de la API y de la base de datos externa.
const db = require("../integraciones/cliente-bd");

async function check(req, res) {
  let database = "ok";
  try {
    await db.ping();
  } catch {
    database = "unreachable";
  }
  res.status(database === "ok" ? 200 : 503).json({ ok: database === "ok", service: "axon-api", database });
}

module.exports = { check };
