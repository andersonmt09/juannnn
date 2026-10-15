// DTOs de entrada para /api/endpoints.
const BaseDto = require("./base.dto");
const { isValidHttpMethod, HTTP_METHODS } = require("../utils/validators");

class CreateEndpointDto extends BaseDto {
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

module.exports = { CreateEndpointDto };
