const { BaseRequestDto } = require("./comunes");
const { ROLES, HTTP_METHODS, SECURITY, isValidHttpMethod, isPositiveInteger } = require("../configuracion");
const monitoringService = require("../servicios/monitoreo");
const { MessageResponseDto } = require("../vistas/comunes");
const {
  MonitoredEndpointListResponseDto,
  MonitoredEndpointResponseDto,
  MonitoredEndpointDetailResponseDto,
  ApiRouteListResponseDto,
} = require("../vistas/monitoreo");

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
    if (this.path.length > SECURITY.DESCRIPTION_MAX_LENGTH) errors.push("La ruta es demasiado larga");
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
    { isAdmin: req.user.role === ROLES.ADMIN },
  ));
}

async function create(req, res) {
  res.status(201).json(new MonitoredEndpointResponseDto(await monitoringService.create(req.dto, apiRoutes(req))));
}

async function remove(req, res) {
  await monitoringService.remove(req.dto.id);
  res.json(new MessageResponseDto("Endpoint eliminado del monitoreo"));
}

module.exports = { CreateMonitoredEndpointRequestDto, MonitoredEndpointIdRequestDto, listRoutes, list, getById, create, remove };
