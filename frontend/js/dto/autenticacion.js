// DTO de petición (req) de /api/auth: lo que envía el cliente, limpio.
import { clean } from "./comunes.js";

// POST /api/auth/register
export class RegisterRequestDto {
  constructor({ name, email, password }) {
    this.name = clean(name);
    this.email = clean(email);
    this.password = password;
  }
}

// POST /api/auth/login
export class CredentialsRequestDto {
  constructor({ email, password }) {
    this.email = clean(email);
    this.password = password;
  }
}

// POST /api/auth/register/verify y POST /api/auth/login/verify
export class VerifyCodeRequestDto {
  constructor({ email, code }) {
    this.email = clean(email);
    this.code = clean(code);
  }
}

// POST /api/auth/register/resend-code y POST /api/auth/login/resend-code
export class ResendCodeRequestDto {
  constructor({ email }) {
    this.email = clean(email);
  }
}

// POST /api/auth/password/forgot
export class ForgotPasswordRequestDto {
  constructor({ email }) {
    this.email = clean(email);
  }
}

// POST /api/auth/password/reset
export class ResetPasswordRequestDto {
  constructor({ email, code, password }) {
    this.email = clean(email);
    this.code = clean(code);
    this.password = password;
  }
}

// POST /api/auth/refresh-token
export class RefreshTokenRequestDto {
  constructor({ refreshToken }) {
    this.refreshToken = refreshToken;
  }
}
