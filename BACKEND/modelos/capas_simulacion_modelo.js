// tabla capas_simulacion: tiempo de cada capa dentro de una simulación
const { db } = require("../config/base-datos");
const layers = require("./capas_modelo");

class SimulationLayer {
  static async recordAll(simulationId, layerMs) {
    await Promise.all(Object.entries(layerMs).map(async ([name, ms]) => db.post("/simulation-layers", {
      simulation_id: simulationId,
      layer_id: await layers.idOf(name),
      duration_ms: Math.round(ms),
    })));
  }
}

module.exports = SimulationLayer;
