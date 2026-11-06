// tabla simulaciones: una fila por simulación
const { db } = require("../config/base-datos");
const SimulationLayer = require("./capas_simulacion_modelo");

class Simulation {
  static async record({ requestLogId, operation, forcedError, totalMs, layerMs }) {
    const row = await db.post("/simulations", {
      request_log_id: requestLogId,
      operation,
      forced_error: forcedError,
      total_ms: Math.round(totalMs),
    });
    await SimulationLayer.recordAll(row.id, layerMs);
  }
}

module.exports = Simulation;
