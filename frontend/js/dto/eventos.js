// DTO de petición (req) de /api/events: lo que envía el cliente.
import { QueryRequestDto } from "./comunes.js";

// GET /api/events/stream?token=
export class StreamRequestDto extends QueryRequestDto {
  constructor({ token }) {
    super();
    this.token = token;
  }
}
