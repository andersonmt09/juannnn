// DTO de petición (req) de /api/simulations: lo que envía el cliente, limpio y validado.
const { BaseRequestDto } = require("./comunes");

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

module.exports = { RunSimulationRequestDto, OPERATIONS };
