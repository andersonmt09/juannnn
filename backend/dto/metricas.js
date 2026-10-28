// DTO de petición (req) de /api/metrics y /api/health: lo que envía el cliente, limpio y validado.
const { BaseRequestDto } = require("./comunes");
const { PAGINATION, isValidHttpMethod, isPositiveInteger } = require("../configuracion");
const metricService = require("../servicios/metricas");
const { DashboardResponseDto, HealthResponseDto, RequestLogListResponseDto, RequestLogDetailResponseDto, ServiceListResponseDto } = require("../vistas/metricas");

const STATUS_CLASSES = ["2xx", "3xx", "4xx", "5xx"];

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

// GET /api/metrics/requests/:id
class RequestLogIdRequestDto extends BaseRequestDto {
  constructor({ id } = {}) {
    super();
    this.id = Number(id);
  }
  validate() {
    return isPositiveInteger(this.id) ? [] : ["El id debe ser un número entero positivo"];
  }
}

// ---------- Funciones que reciben la petición (req) ----------

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
  res.json(new ServiceListResponseDto(await metricService.getServices()));
}

async function checkHealth(req, res) {
  const status = await metricService.checkHealth();
  res.status(status.databaseAvailable ? 200 : 503).json(new HealthResponseDto(status));
}

module.exports = { ListRequestLogsRequestDto, RequestLogIdRequestDto, getDashboard, listRequests, getRequest, getServices, checkHealth };
