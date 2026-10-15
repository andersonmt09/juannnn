// Emisión y verificación de tokens JWT (acceso y refresh).
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { env } = require("../config/environment");
const HttpError = require("../utils/http-error");

function issueTokens(user) {
  const payload = { id: user.id, email: user.email, name: user.name, role: user.role };
  const accessToken = jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
  const refreshToken = jwt.sign({ id: user.id, jti: crypto.randomUUID() }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  });
  return { accessToken, refreshToken };
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.jwt.secret);
  } catch {
    throw HttpError.unauthorized("Token inválido o expirado");
  }
}

function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, env.jwt.refreshSecret);
  } catch {
    throw HttpError.unauthorized("Refresh token inválido o expirado");
  }
}

module.exports = { issueTokens, verifyAccessToken, verifyRefreshToken };
