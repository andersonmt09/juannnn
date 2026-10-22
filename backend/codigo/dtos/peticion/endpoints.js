// DTOs de petición de /api/endpoints: limpian y validan lo que envía el cliente.
const BaseDto = require("./base");
const { isValidHttpMethod, isPositiveInteger, HTTP_METHODS } = require("../../utilidades/validaciones");

// POST /api/endpoints
class CreateEndpointRequestDto extends BaseDto {
  constructor({ name, path, method, description } = {}) {
    super();
    this.name = String(name || "").trim();
    this.path = String(path || "").trim();
    this.method = String(method || "").trim().toUpperCase();
    this.description = description ? String(description).trim() : null;
  }
  validate() {
    const errors = [];
    if (!this.name) errors.push("El nombre es obligatorio");
    if (!this.path.startsWith("/")) errors.push("La ruta debe comenzar con /");
    if (!isValidHttpMethod(this.method)) errors.push(`El método debe ser uno de: ${HTTP_METHODS.join(", ")}`);
    return errors;
  }
}

// DELETE /api/endpoints/:id
class EndpointIdRequestDto extends BaseDto {
  constructor({ id } = {}) {
    super();
    this.id = Number(id);
  }
  validate() {
    return isPositiveInteger(this.id) ? [] : ["El id debe ser un número entero positivo"];
  }
}

module.exports = { CreateEndpointRequestDto, EndpointIdRequestDto };
