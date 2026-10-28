// DTO de petición (req) de /api/metrics: lo que envía el cliente.
import { QueryRequestDto } from "./comunes.js";

// GET /api/metrics/requests?page=&limit=&method=&statusClass=
export class ListRequestLogsRequestDto extends QueryRequestDto {
  constructor({ page = 1, limit = 20, method, statusClass } = {}) {
    super();
    this.page = page;
    this.limit = limit;
    this.method = method;
    this.statusClass = statusClass;
  }
}

// GET /api/metrics/requests/:id (el id va en la URL)
export class RequestLogIdRequestDto {
  constructor({ id }) {
    this.id = id;
  }
}
