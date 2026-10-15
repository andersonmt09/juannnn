/**
 * Clase base de los DTOs de entrada.
 * Cada DTO limpia los datos recibidos en el constructor y define validate().
 */
const HttpError = require("../utils/http-error");

class BaseDto {
  /** @returns {string[]} lista de errores (vacía si es válido) */
  validate() {
    return [];
  }

  /** Lanza 400 con todos los errores si los datos no son válidos. */
  assertValid() {
    const errors = this.validate();
    if (errors.length) throw HttpError.badRequest(errors[0], errors);
    return this;
  }
}

module.exports = BaseDto;
