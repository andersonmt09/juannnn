// DTOs de respuesta de /api/monitoring.

// Un endpoint monitoreado con sus estadísticas reales (tomadas del registro de peticiones).
class MonitoredEndpointDto {
  constructor(endpoint, stats) {
    this.id = endpoint.id;
    this.name = endpoint.name;
    this.method = endpoint.method;
    this.path = endpoint.path;
    this.description = endpoint.description;
    this.createdAt = endpoint.createdAt;
    this.stats = {
      requests: stats?.total || 0,
      errors: stats?.errors || 0,
      avgLatencyMs: stats?.avgLatencyMs || 0,
      lastRequestAt: stats?.lastRequestAt || null,
    };
  }
}

// GET /api/monitoring/endpoints → { ok, data: [] }
class MonitoredEndpointListResponseDto {
  constructor(items) {
    this.ok = true;
    this.data = items.map(({ endpoint, stats }) => new MonitoredEndpointDto(endpoint, stats));
  }
}

// POST /api/monitoring/endpoints → { ok, data }
class MonitoredEndpointResponseDto {
  constructor({ endpoint, stats }) {
    this.ok = true;
    this.data = new MonitoredEndpointDto(endpoint, stats);
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
  ApiRouteListResponseDto,
};
