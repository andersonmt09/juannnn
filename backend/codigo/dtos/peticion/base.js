// Clase base de los DTOs de petición: cada DTO limpia los datos en el constructor y define validate().
const HttpError = require("../../utilidades/error-http");

class BaseDto {
  // @returns {string[]} lista de errores (vacía si es válido)
  validate() {
    return [];
  }

  // Lanza 400 con todos los errores si los datos no son válidos.
  assertValid() {
    const errors = this.validate();
    if (errors.length) throw HttpError.badRequest(errors[0], errors);
    return this;
  }
}

module.exports = BaseDto;
