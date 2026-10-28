// la IP solo se incluye para administradores
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

class RequestLogListResponseDto {
  constructor({ logs, total, page, limit }) {
    this.ok = true;
    this.data = logs.map((log) => new RequestLogDto(log, { includeSource: true }));
    this.meta = { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }
}

class ServiceListResponseDto {
  constructor(services) {
    this.ok = true;
    this.data = services.map(({ key, name, role, status, detail }) => ({ key, name, role, status, detail }));
  }
}

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
