// DTOs de respuesta compartidos por varios endpoints: mensajes de confirmación y errores.

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

module.exports = { MessageResponseDto, ErrorResponseDto };
