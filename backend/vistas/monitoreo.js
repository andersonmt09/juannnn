const { RequestLogDto } = require("./metricas");

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
      errorRate: stats?.errorRate || 0,
      avgLatencyMs: stats?.avgLatencyMs || 0,
      lastRequestAt: stats?.lastRequestAt || null,
    };
  }
}

class MonitoredEndpointListResponseDto {
  constructor(items) {
    this.ok = true;
    this.data = items.map(({ endpoint, stats, status }) => new MonitoredEndpointDto(endpoint, stats, status));
  }
}

class MonitoredEndpointResponseDto {
  constructor({ endpoint, stats, status }) {
    this.ok = true;
    this.data = new MonitoredEndpointDto(endpoint, stats, status);
  }
}

class MonitoredEndpointDetailResponseDto {
  constructor({ endpoint, stats, status, recentRequests }, { isAdmin = false } = {}) {
    this.ok = true;
    this.data = {
      ...new MonitoredEndpointDto(endpoint, stats, status),
      // la IP solo la ve el administrador
      recentRequests: recentRequests.map((log) => new RequestLogDto(log, { includeSource: isAdmin })),
    };
  }
}

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
