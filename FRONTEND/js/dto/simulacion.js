export class RunSimulationRequestDto {
  constructor({ operation = "users", forceError = false } = {}) {
    this.operation = operation;
    this.forceError = forceError;
  }
}
