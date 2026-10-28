// Vista (res) de /api/events: eventos SSE y respuestas del stream.
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
    this.id = log.id ?? null;
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

module.exports = { ConnectedEventDto, HeartbeatEventDto, ActivityEventDto, PongResponseDto };
