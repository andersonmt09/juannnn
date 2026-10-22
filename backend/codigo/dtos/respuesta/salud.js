// DTO de respuesta de GET /api/health.
class HealthResponseDto {
  constructor({ databaseAvailable }) {
    this.ok = databaseAvailable;
    this.service = "axon-api";
    this.database = databaseAvailable ? "ok" : "unreachable";
  }
}

module.exports = { HealthResponseDto };
