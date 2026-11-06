import { clean } from "./comunes.js";

export class RegisterRequestDto {
  constructor({ name, email, password }) {
    this.name = clean(name);
    this.email = clean(email);
    this.password = password;
  }
}

export class CredentialsRequestDto {
  constructor({ email, password }) {
    this.email = clean(email);
    this.password = password;
  }
}

export class VerifyCodeRequestDto {
  constructor({ email, code }) {
    this.email = clean(email);
    this.code = clean(code);
  }
}

export class ResendCodeRequestDto {
  constructor({ email }) {
    this.email = clean(email);
  }
}

export class RefreshTokenRequestDto {
  constructor({ refreshToken }) {
    this.refreshToken = refreshToken;
  }
}
