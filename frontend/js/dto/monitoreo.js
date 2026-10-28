import { clean } from "./comunes.js";

export class MonitoredEndpointIdRequestDto {
  constructor({ id }) {
    this.id = id;
  }
}

export class CreateMonitoredEndpointRequestDto {
  constructor({ method, path, name, description }) {
    this.method = clean(method);
    this.path = clean(path);
    this.name = clean(name);
    this.description = clean(description);
  }
}
