// DTO de petición (req) de /api/simulations: lo que envía el cliente.

// POST /api/simulations
export class RunSimulationRequestDto {
  constructor({ operation = "users", forceError = false } = {}) {
    this.operation = operation;
    this.forceError = forceError;
  }
}
