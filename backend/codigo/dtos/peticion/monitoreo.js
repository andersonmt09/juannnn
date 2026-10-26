// DTOs de petición de /api/monitoring: limpian y validan lo que envía el cliente.
const BaseDto = require("./base");
const { isValidHttpMethod, isPositiveInteger, HTTP_METHODS } = require("../../utilidades/validaciones");

// POST /api/monitoring/endpoints
class CreateMonitoredEndpointRequestDto extends BaseDto {
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
class MonitoredEndpointIdRequestDto extends BaseDto {
  constructor({ id } = {}) {
    super();
    this.id = Number(id);
  }
  validate() {
    return isPositiveInteger(this.id) ? [] : ["El id debe ser un número entero positivo"];
  }
}

module.exports = { CreateMonitoredEndpointRequestDto, MonitoredEndpointIdRequestDto };
