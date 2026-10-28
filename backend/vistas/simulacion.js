const LAYER_NAMES = {
  client: "Cliente / UI",
  api: "Capa API",
  backend: "Backend / Lógica",
  database: "Base de datos",
};

class SimulationResponseDto {
  constructor({ request, layers, data, totalMs }, { path = "/api/simulations" } = {}) {
    this.ok = true;
    this.request = {
      method: "POST",
      path,
      operation: request.operation,
      startedAt: request.startedAt,
    };
    this.layers = Object.keys(LAYER_NAMES).map((key, index) => ({
      order: index + 1,
      key,
      name: LAYER_NAMES[key],
      detail: layers[key].detail,
      durationMs: layers[key].durationMs,
    }));
    this.data = data;
    this.totalMs = totalMs;
  }
}

module.exports = { SimulationResponseDto };
