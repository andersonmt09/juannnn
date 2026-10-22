// DTOs de respuesta de /api/metrics.

// Una petición registrada (actividad reciente).
class RequestLogDto {
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

// GET /api/metrics/dashboard → { ok, data: { summary, requestsByStatus, requestsByMethod, recentRequests } }
class DashboardResponseDto {
  constructor({ summary, requestsByStatus, requestsByMethod, recentRequests }) {
    this.ok = true;
    this.data = {
      summary,
      requestsByStatus,
      requestsByMethod,
      recentRequests: recentRequests.map((log) => new RequestLogDto(log)),
    };
  }
}

module.exports = { RequestLogDto, DashboardResponseDto };
