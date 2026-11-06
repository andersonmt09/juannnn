// tabla sesiones: registro de cada inicio de sesión (el token se valida con JWT + token_version)
const { db } = require("../config/base-datos");

class Session {
  static async open({ userId, tokenVersion, ipAddress, userAgent, expiresAt }) {
    await db.post("/sessions", {
      user_id: userId,
      token_version: tokenVersion,
      ip_address: ipAddress,
      user_agent: userAgent,
      expires_at: expiresAt.toISOString(),
    });
  }

  // marca como revocadas las sesiones abiertas del usuario
  static async revokeAll(userId) {
    const now = new Date().toISOString();
    // al revocar salen de la consulta, así que siempre se pide la página 1
    for (;;) {
      const { data } = await db.get("/sessions", { user_id: userId, revoked_at: "null", limit: 100 });
      if (!data.length) return;
      await Promise.all(data.map((s) => db.patch(`/sessions/${s.id}`, { revoked_at: now })));
    }
  }
}

module.exports = Session;
