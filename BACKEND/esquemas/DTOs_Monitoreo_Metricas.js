// DTO de secciones vigiladas, registros de peticiones y métricas
const { BaseRequestDto } = require("./DTOs_Comunes");
const { HTTP_METHODS, PAGINATION, SECURITY, isPositiveInteger, isValidHttpMethod } = require("../config/configuracion");

// ---------- Petición (validan y limpian lo que llega)

const PATH_MAX_LENGTH = 255;

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
    if (this.name.length > SECURITY.NAME_MAX_LENGTH) errors.push(`El nombre no puede superar ${SECURITY.NAME_MAX_LENGTH} caracteres`);
    if (this.description && this.description.length > SECURITY.DESCRIPTION_MAX_LENGTH) {
      errors.push(`La descripción no puede superar ${SECURITY.DESCRIPTION_MAX_LENGTH} caracteres`);
    }
    if (this.path.length > PATH_MAX_LENGTH) errors.push("La ruta es demasiado larga");
    if (!isValidHttpMethod(this.method)) errors.push(`El método debe ser uno de: ${HTTP_METHODS.join(", ")}`);
    if (!this.path.startsWith("/api/")) errors.push("La ruta debe empezar por /api/");
    return errors;
  }
}

class MonitoredEndpointIdRequestDto extends BaseRequestDto {
  constructor({ id } = {}) {
    super();
    this.id = Number(id);
  }
  validate() {
    return isPositiveInteger(this.id) ? [] : ["El id debe ser un número entero positivo"];
  }
}

const STATUS_CLASSES = ["2xx", "3xx", "4xx", "5xx"];

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

class RequestLogIdRequestDto extends BaseRequestDto {
  constructor({ id } = {}) {
    super();
    this.id = Number(id);
  }
  validate() {
    return isPositiveInteger(this.id) ? [] : ["El id debe ser un número entero positivo"];
  }
}

// ---------- Respuesta (lo que se devuelve)

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

// se exportan antes de cargar rutas/: las rutas también usan estos DTO
module.exports = {
  CreateMonitoredEndpointRequestDto,
  MonitoredEndpointIdRequestDto,
  ListRequestLogsRequestDto,
  RequestLogIdRequestDto,
  RequestLogDto,
  RequestLogDetailResponseDto,
  DashboardResponseDto,
  RequestLogListResponseDto,
  ServiceListResponseDto,
  HealthResponseDto,
  MonitoredEndpointDto,
  MonitoredEndpointListResponseDto,
  MonitoredEndpointResponseDto,
  MonitoredEndpointDetailResponseDto,
  ApiRouteListResponseDto,
};

// ---------- Funciones de los endpoints (reciben req, llaman a rutas/ y responden con un DTO)

const monitoringService = require("../rutas/monitoreo");
const metricService = require("../rutas/metricas");
const { MessageResponseDto } = require("./DTOs_Comunes");

// monitoreo
const apiRoutes = (req) => req.app.locals.apiRoutes || [];

function listRoutes(req, res) {
  res.json(new ApiRouteListResponseDto(apiRoutes(req)));
}

async function list(req, res) {
  res.json(new MonitoredEndpointListResponseDto(await monitoringService.list()));
}

async function getById(req, res) {
  res.json(new MonitoredEndpointDetailResponseDto(
    await monitoringService.getById(req.dto.id),
    { isAdmin: req.user.isAdmin() },
  ));
}

async function create(req, res) {
  res.status(201).json(new MonitoredEndpointResponseDto(await monitoringService.create(req.dto, apiRoutes(req))));
}

async function remove(req, res) {
  await monitoringService.remove(req.dto.id);
  res.json(new MessageResponseDto("Endpoint eliminado del monitoreo"));
}

// metricas
async function getDashboard(req, res) {
  res.json(new DashboardResponseDto(await metricService.getDashboard()));
}

async function listRequests(req, res) {
  res.json(new RequestLogListResponseDto(await metricService.listRequests(req.dto)));
}

async function getRequest(req, res) {
  res.json(new RequestLogDetailResponseDto(await metricService.getRequest(req.dto.id)));
}

async function getServices(req, res) {
  res.json(new ServiceListResponseDto(await metricService.getServices(req.user)));
}

async function checkHealth(req, res) {
  const status = await metricService.checkHealth();
  res.status(status.databaseAvailable ? 200 : 503).json(new HealthResponseDto(status));
}

Object.assign(module.exports, {
  listRoutes,
  list,
  getById,
  create,
  remove,
  getDashboard,
  listRequests,
  getRequest,
  getServices,
  checkHealth,
});
