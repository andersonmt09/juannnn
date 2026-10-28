class ConnectedEventDto {
  constructor({ clientId }) {
    this.clientId = clientId;
    this.serverTime = new Date().toISOString();
  }
}

class HeartbeatEventDto {
  constructor({ clients, uptimeSeconds }) {
    this.serverTime = new Date().toISOString();
    this.uptimeSeconds = uptimeSeconds;
    this.clients = clients;
  }
}

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

class PongResponseDto {
  constructor() {
    this.ok = true;
    this.event = "stream:pong";
    this.serverTime = new Date().toISOString();
  }
}

module.exports = { ConnectedEventDto, HeartbeatEventDto, ActivityEventDto, PongResponseDto };
