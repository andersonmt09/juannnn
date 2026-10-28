// DTO de petición (req) de /api/events: lo que envía el cliente, limpio y validado.
const { BaseRequestDto } = require("./comunes");

// GET /api/events/stream?token=
class StreamRequestDto extends BaseRequestDto {
  constructor({ token } = {}) {
    super();
    this.token = String(token || "").trim();
  }
  validate() {
    return this.token ? [] : ["El token es obligatorio"];
  }
}

module.exports = { StreamRequestDto };
