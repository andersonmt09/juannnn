import { QueryRequestDto } from "./comunes.js";

export class StreamRequestDto extends QueryRequestDto {
  constructor({ token }) {
    super();
    this.token = token;
  }
}
