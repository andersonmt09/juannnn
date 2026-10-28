// Vista (res) de /api/auth: lo que el servidor devuelve al cliente.
const { UserDto } = require("./usuarios");

// POST /api/auth/register y POST /api/auth/login → falta verificar el código enviado al correo.
class VerificationRequiredResponseDto {
  constructor({ email }) {
    this.ok = true;
    this.requiresVerification = true;
    this.email = email;
  }
}

// POST /api/auth/register/verify
class EmailVerifiedResponseDto {
  constructor() {
    this.ok = true;
    this.verified = true;
  }
}

// POST /api/auth/login/verify, POST /api/auth/refresh-token y PATCH /api/users/:id/password (propia)
class SessionResponseDto {
  constructor({ accessToken, refreshToken, user }) {
    this.ok = true;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.user = new UserDto(user);
  }
}

module.exports = {
  VerificationRequiredResponseDto,
  EmailVerifiedResponseDto,
  SessionResponseDto,
};
