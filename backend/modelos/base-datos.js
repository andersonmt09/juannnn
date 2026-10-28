const { db } = require("../externos");

class Database {
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
