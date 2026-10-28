import { QueryRequestDto } from "./comunes.js";

export class ListRequestLogsRequestDto extends QueryRequestDto {
  constructor({ page = 1, limit = 20, method, statusClass } = {}) {
    super();
    this.page = page;
    this.limit = limit;
    this.method = method;
    this.statusClass = statusClass;
  }
}

export class RequestLogIdRequestDto {
  constructor({ id }) {
    this.id = id;
  }
}
