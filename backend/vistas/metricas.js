// Vista de /api/metrics y /api/health: solo respuestas (estos endpoints no reciben datos).

// ---------- Respuesta (res) ----------

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

// GET /api/health
class HealthResponseDto {
  constructor({ databaseAvailable }) {
    this.ok = databaseAvailable;
    this.service = "axon-api";
    this.database = databaseAvailable ? "ok" : "unreachable";
  }
}

module.exports = { RequestLogDto, DashboardResponseDto, HealthResponseDto };
