// Comprueba si la API de la base de datos externa responde.
const db = require("../integraciones/cliente-bd");

async function check() {
  try {
    await db.ping();
    return { databaseAvailable: true };
  } catch {
    return { databaseAvailable: false };
  }
}

module.exports = { check };
