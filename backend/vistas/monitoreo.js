// Vista (res) de /api/monitoring: lo que el servidor devuelve al cliente.
const { RequestLogDto } = require("./metricas");

// Un endpoint monitoreado con sus estadísticas reales (tomadas del registro de peticiones).
class MonitoredEndpointDto {
  constructor(endpoint, stats, status) {
    this.id = endpoint.id;
    this.name = endpoint.name;
    this.method = endpoint.method;
    this.path = endpoint.path;
    this.description = endpoint.description;
    this.createdAt = endpoint.createdAt;
    this.status = status;
    this.stats = {
      requests: stats?.total || 0,
      errors: stats?.errors || 0,
      errorRate: stats?.errorRate || 0, // lo calcula el servicio
      avgLatencyMs: stats?.avgLatencyMs || 0,
      lastRequestAt: stats?.lastRequestAt || null,
    };
  }
}

// GET /api/monitoring/endpoints → { ok, data: [] }
class MonitoredEndpointListResponseDto {
  constructor(items) {
    this.ok = true;
    this.data = items.map(({ endpoint, stats, status }) => new MonitoredEndpointDto(endpoint, stats, status));
  }
}

// POST /api/monitoring/endpoints → { ok, data }
class MonitoredEndpointResponseDto {
  constructor({ endpoint, stats, status }) {
    this.ok = true;
    this.data = new MonitoredEndpointDto(endpoint, stats, status);
  }
}

// GET /api/monitoring/endpoints/:id → { ok, data: { ...MonitoredEndpointDto, recentRequests: RequestLogDto[] } }
class MonitoredEndpointDetailResponseDto {
  constructor({ endpoint, stats, status, recentRequests }, { isAdmin = false } = {}) {
    this.ok = true;
    this.data = {
      ...new MonitoredEndpointDto(endpoint, stats, status),
      // La IP de origen solo la ve el administrador.
      recentRequests: recentRequests.map((log) => new RequestLogDto(log, { includeSource: isAdmin })),
    };
  }
}

// GET /api/monitoring/routes → rutas reales de la API que se pueden monitorear.
class ApiRouteListResponseDto {
  constructor(routes) {
    this.ok = true;
    this.data = routes.map(({ method, path }) => ({ method, path }));
  }
}

module.exports = {
  MonitoredEndpointDto,
  MonitoredEndpointListResponseDto,
  MonitoredEndpointResponseDto,
  MonitoredEndpointDetailResponseDto,
  ApiRouteListResponseDto,
};
