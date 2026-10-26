// Vista de /api/monitoring: lo que entra (DTOs de petición) y lo que sale (DTOs de respuesta).
const { BaseRequestDto } = require("./comunes");
const { HTTP_METHODS, isValidHttpMethod, isPositiveInteger } = require("../configuracion");

// ---------- Petición (req) ----------

// POST /api/monitoring/endpoints
class CreateMonitoredEndpointRequestDto extends BaseRequestDto {
  constructor({ name, method, path, description } = {}) {
    super();
    this.name = String(name || "").trim();
    this.method = String(method || "").trim().toUpperCase();
    this.path = String(path || "").trim();
    this.description = description ? String(description).trim() : null;
  }
  validate() {
    const errors = [];
    if (!this.name) errors.push("El nombre es obligatorio");
    if (!isValidHttpMethod(this.method)) errors.push(`El método debe ser uno de: ${HTTP_METHODS.join(", ")}`);
    if (!this.path.startsWith("/api/")) errors.push("La ruta debe empezar por /api/");
    return errors;
  }
}

// DELETE /api/monitoring/endpoints/:id
class MonitoredEndpointIdRequestDto extends BaseRequestDto {
  constructor({ id } = {}) {
    super();
    this.id = Number(id);
  }
  validate() {
    return isPositiveInteger(this.id) ? [] : ["El id debe ser un número entero positivo"];
  }
}

// ---------- Respuesta (res) ----------

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
  CreateMonitoredEndpointRequestDto,
  MonitoredEndpointIdRequestDto,
  MonitoredEndpointDto,
  MonitoredEndpointListResponseDto,
  MonitoredEndpointResponseDto,
  ApiRouteListResponseDto,
};
