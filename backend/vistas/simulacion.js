// Vista de /api/simulations: petición de la simulación y respuesta con las capas medidas.
const { BaseRequestDto } = require("./comunes");

const OPERATIONS = ["users", "endpoints", "requests"];

// ---------- Petición (req) ----------

// POST /api/simulations
class RunSimulationRequestDto extends BaseRequestDto {
  constructor({ operation = "users", forceError = false } = {}) {
    super();
    this.operation = String(operation).trim().toLowerCase();
    this.forceError = forceError === true || forceError === "true";
  }
  validate() {
    return OPERATIONS.includes(this.operation) ? [] : [`La operación debe ser una de: ${OPERATIONS.join(", ")}`];
  }
}

// ---------- Respuesta (res) ----------

const LAYER_NAMES = {
  client: "Cliente / UI",
  api: "Capa API",
  backend: "Backend / Lógica",
  database: "Base de datos",
};

// Las capas van siempre en este orden: client, api, backend, database.
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

module.exports = { OPERATIONS, RunSimulationRequestDto, SimulationResponseDto };
