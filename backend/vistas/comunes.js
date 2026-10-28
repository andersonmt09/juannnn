// Vista (res) de respuestas comunes a toda la API: lo que el servidor devuelve al cliente.

// { ok: true, message }
class MessageResponseDto {
  constructor(message) {
    this.ok = true;
    this.message = message;
  }
}

// { ok: false, message, errors?, code?, path?, method? }
class ErrorResponseDto {
  constructor(message, { errors, code, path, method } = {}) {
    this.ok = false;
    this.message = message;
    if (errors) this.errors = errors;
    if (code) this.code = code;
    if (path) this.path = path;
    if (method) this.method = method;
  }
}

module.exports = { MessageResponseDto, ErrorResponseDto };
