// Vista (res) de /api/metrics y /api/health: lo que el servidor devuelve al cliente.
// Una petición registrada (actividad reciente).
// La IP (source) solo se incluye cuando se pide (administradores).
class RequestLogDto {
  constructor(log, { includeSource = false } = {}) {
    this.id = log.id;
    this.method = log.method;
    this.path = log.path;
    this.route = log.route;
    this.statusCode = log.statusCode;
    this.latencyMs = log.latencyMs;
    if (includeSource) this.source = log.source;
    this.createdAt = log.createdAt;
  }
}

// GET /api/metrics/requests/:id → { ok, data: { ...RequestLogDto, userId, user: { id, name, email } | null } }
class RequestLogDetailResponseDto {
  constructor({ log, user }) {
    this.ok = true;
    this.data = {
      ...new RequestLogDto(log, { includeSource: true }),
      userId: log.userId ?? null,
      user: user ? { id: user.id, name: user.name, email: user.email } : null,
    };
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
      recentRequests: recentRequests.map((log) => new RequestLogDto(log, { includeSource: true })),
    };
  }
}

// GET /api/metrics/requests → { ok, data: RequestLogDto[], meta: { total, page, limit, totalPages } }
class RequestLogListResponseDto {
  constructor({ logs, total, page, limit }) {
    this.ok = true;
    this.data = logs.map((log) => new RequestLogDto(log, { includeSource: true }));
    this.meta = { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }
}

// GET /api/metrics/services → { ok, data: [{ key, name, role, status, detail }] }
class ServiceListResponseDto {
  constructor(services) {
    this.ok = true;
    this.data = services.map(({ key, name, role, status, detail }) => ({ key, name, role, status, detail }));
  }
}

// GET /api/health
class HealthResponseDto {
  constructor({ databaseAvailable, databaseLatencyMs, uptimeSeconds }) {
    this.ok = databaseAvailable;
    this.status = databaseAvailable ? "online" : "degraded";
    this.service = "axon-api";
    this.database = databaseAvailable ? "connected" : "disconnected";
    this.databaseLatencyMs = databaseLatencyMs;
    this.uptimeSeconds = uptimeSeconds;
    this.timestamp = new Date().toISOString();
  }
}

module.exports = {
  RequestLogDto,
  RequestLogDetailResponseDto,
  DashboardResponseDto,
  RequestLogListResponseDto,
  ServiceListResponseDto,
  HealthResponseDto,
};
