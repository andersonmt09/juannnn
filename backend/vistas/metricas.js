// Vista de /api/metrics y /api/health.
const { BaseRequestDto } = require("./comunes");
const { PAGINATION, isValidHttpMethod } = require("../configuracion");

const STATUS_CLASSES = ["2xx", "3xx", "4xx", "5xx"];

// ---------- Petición (req) ----------

// GET /api/metrics/requests?page=&limit=&method=&statusClass=
class ListRequestLogsRequestDto extends BaseRequestDto {
  constructor({ page, limit, method, statusClass } = {}) {
    super();
    this.page = Math.max(1, Number(page) || 1);
    this.limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1, Number(limit) || PAGINATION.DEFAULT_LIMIT));
    this.method = method ? String(method).toUpperCase() : undefined;
    this.statusClass = statusClass ? String(statusClass).toLowerCase() : undefined;
  }
  validate() {
    const errors = [];
    if (this.method && !isValidHttpMethod(this.method)) errors.push("El método HTTP no es válido");
    if (this.statusClass && !STATUS_CLASSES.includes(this.statusClass)) {
      errors.push(`La clase de estado debe ser una de: ${STATUS_CLASSES.join(", ")}`);
    }
    return errors;
  }
}

// ---------- Respuesta (res) ----------

// Una petición registrada (actividad reciente).
class RequestLogDto {
  constructor(log) {
    this.id = log.id;
    this.method = log.method;
    this.path = log.path;
    this.route = log.route;
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

// GET /api/metrics/requests → { ok, data: RequestLogDto[], meta: { total, page, limit, totalPages } }
class RequestLogListResponseDto {
  constructor({ logs, total, page, limit }) {
    this.ok = true;
    this.data = logs.map((log) => new RequestLogDto(log));
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
  ListRequestLogsRequestDto,
  RequestLogDto,
  DashboardResponseDto,
  RequestLogListResponseDto,
  ServiceListResponseDto,
  HealthResponseDto,
};
