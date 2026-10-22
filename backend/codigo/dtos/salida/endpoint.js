// DTO de salida de un endpoint monitoreado.
class EndpointResponseDto {
  constructor(endpoint) {
    this.id = endpoint.id;
    this.name = endpoint.name;
    this.path = endpoint.path;
    this.method = endpoint.method;
    this.description = endpoint.description;
    this.createdAt = endpoint.createdAt;
  }
}

module.exports = { EndpointResponseDto };
