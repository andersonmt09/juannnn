// tabla revisiones_servicio: resultado de cada revisión de servicios
const { db } = require("../config/base-datos");
const services = require("./servicios_modelo");

class ServiceCheck {
  static async record({ service, userId, available, latencyMs = null }) {
    await db.post("/service-checks", {
      service_id: await services.idOf(service),
      user_id: userId,
      available,
      latency_ms: latencyMs,
    });
  }
}

module.exports = ServiceCheck;
