const { BaseRequestDto } = require("./comunes");
const { performance } = require("perf_hooks");
const simulationService = require("../servicios/simulacion");
const { SimulationResponseDto } = require("../vistas/simulacion");

const OPERATIONS = ["users", "endpoints", "requests"];

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

async function run(req, res) {
  const result = await simulationService.run(req.dto, req.receivedAt ?? performance.now());
  res.json(new SimulationResponseDto(result, { path: req.baseUrl }));
}

module.exports = { RunSimulationRequestDto, OPERATIONS, run };
