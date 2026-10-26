// Piezas compartidas por todas las vistas (DTOs): la clase base de las peticiones y las respuestas comunes.
const { HttpError } = require("../configuracion");

// ---------- Petición (req) ----------

// Cada DTO de petición limpia los datos en el constructor y define validate().
class BaseRequestDto {
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

// ---------- Respuesta (res) ----------

// { ok: true, message }
class MessageResponseDto {
  constructor(message) {
    this.ok = true;
    this.message = message;
  }
}

// { ok: false, message, errors? }
class ErrorResponseDto {
  constructor(message, errors) {
    this.ok = false;
    this.message = message;
    if (errors) this.errors = errors;
  }
}

module.exports = { BaseRequestDto, MessageResponseDto, ErrorResponseDto };
