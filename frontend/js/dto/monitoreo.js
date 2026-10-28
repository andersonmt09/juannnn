// DTO de petición (req) de /api/monitoring: lo que envía el cliente, limpio.
import { clean } from "./comunes.js";

// GET /api/monitoring/endpoints/:id y DELETE /api/monitoring/endpoints/:id (el id va en la URL)
export class MonitoredEndpointIdRequestDto {
  constructor({ id }) {
    this.id = id;
  }
}

// POST /api/monitoring/endpoints
export class CreateMonitoredEndpointRequestDto {
  constructor({ method, path, name, description }) {
    this.method = clean(method);
    this.path = clean(path);
    this.name = clean(name);
    this.description = clean(description);
  }
}
