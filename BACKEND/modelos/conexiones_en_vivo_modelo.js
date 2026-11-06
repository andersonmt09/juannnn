// tabla conexiones_en_vivo: conexiones del stream de actividad
const { db } = require("../config/base-datos");

class LiveConnection {
  static async open({ userId, clientId }) {
    await db.post("/live-connections", { user_id: userId, client_id: clientId });
  }

  static async close(clientId, reason) {
    const { data } = await db.get("/live-connections", { client_id: clientId, limit: 1 });
    if (data[0]) await db.patch(`/live-connections/${data[0].id}`, { closed_at: new Date().toISOString(), close_reason: reason });
  }
}

module.exports = LiveConnection;
