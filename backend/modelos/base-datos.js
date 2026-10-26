// Modelo del estado de la base de datos externa (recurso /health de su API).
const { db } = require("../externos");

class Database {
  // Nunca lanza error: { available, latencyMs }
  static async ping() {
    const startedAt = performance.now();
    let available = true;
    try {
      await db.ping();
    } catch {
      available = false;
    }
    return { available, latencyMs: Math.round(performance.now() - startedAt) };
  }
}

module.exports = Database;
