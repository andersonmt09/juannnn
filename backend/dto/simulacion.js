// DTO de petición (req) de /api/simulations: lo que envía el cliente, limpio y validado.
const { BaseRequestDto } = require("./comunes");
const { performance } = require("perf_hooks");
const simulationService = require("../servicios/simulacion");
const { SimulationResponseDto } = require("../vistas/simulacion");

const OPERATIONS = ["users", "endpoints", "requests"];

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

// ---------- Funciones que reciben la petición (req) ----------

async function run(req, res) {
  const result = await simulationService.run(req.dto, req.receivedAt ?? performance.now());
  res.json(new SimulationResponseDto(result, { path: req.baseUrl }));
}

module.exports = { RunSimulationRequestDto, OPERATIONS, run };
