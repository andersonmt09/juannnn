// DTO de salida de una petición registrada (actividad reciente del panel).
class RequestLogResponseDto {
  constructor(log) {
    this.id = log.id;
    this.method = log.method;
    this.path = log.path;
    this.statusCode = log.statusCode;
    this.latencyMs = log.latencyMs;
    this.source = log.source;
    this.createdAt = log.createdAt;
  }
}

module.exports = { RequestLogResponseDto };
