// Vista de /api/events: petición del stream y DTOs de los eventos SSE.
const { BaseRequestDto } = require("./comunes");

// ---------- Petición (req) ----------

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

// ---------- Respuesta (eventos y respuestas) ----------

// stream:connected
class ConnectedEventDto {
  constructor({ clientId }) {
    this.clientId = clientId;
    this.serverTime = new Date().toISOString();
  }
}

// stream:heartbeat
class HeartbeatEventDto {
  constructor({ clients, uptimeSeconds }) {
    this.serverTime = new Date().toISOString();
    this.uptimeSeconds = uptimeSeconds;
    this.clients = clients;
  }
}

// api:activity (sin usuario, IP ni query)
class ActivityEventDto {
  constructor(log) {
    this.method = log.method;
    this.path = log.path;
    this.statusCode = log.statusCode;
    this.latencyMs = log.latencyMs;
    this.createdAt = log.createdAt || new Date().toISOString();
  }
}

// POST /api/events/ping
class PongResponseDto {
  constructor() {
    this.ok = true;
    this.event = "stream:pong";
    this.serverTime = new Date().toISOString();
  }
}

module.exports = { StreamRequestDto, ConnectedEventDto, HeartbeatEventDto, ActivityEventDto, PongResponseDto };
