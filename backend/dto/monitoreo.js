// DTO de petición (req) de /api/monitoring: lo que envía el cliente, limpio y validado.
const { BaseRequestDto } = require("./comunes");
const { HTTP_METHODS, SECURITY, isValidHttpMethod, isPositiveInteger } = require("../configuracion");

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

module.exports = { CreateMonitoredEndpointRequestDto, MonitoredEndpointIdRequestDto };
