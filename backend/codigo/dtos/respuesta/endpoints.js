// DTOs de respuesta de /api/endpoints.

// Datos de un endpoint monitoreado.
class EndpointDto {
  constructor(endpoint) {
    this.id = endpoint.id;
    this.name = endpoint.name;
    this.path = endpoint.path;
    this.method = endpoint.method;
    this.description = endpoint.description;
    this.createdAt = endpoint.createdAt;
  }
}

// POST /api/endpoints → { ok, data }
class EndpointResponseDto {
  constructor(endpoint) {
    this.ok = true;
    this.data = new EndpointDto(endpoint);
  }
}

// GET /api/endpoints → { ok, data: [] }
class EndpointListResponseDto {
  constructor(endpoints) {
    this.ok = true;
    this.data = endpoints.map((endpoint) => new EndpointDto(endpoint));
  }
}

module.exports = { EndpointDto, EndpointResponseDto, EndpointListResponseDto };
