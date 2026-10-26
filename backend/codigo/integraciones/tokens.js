// Tokens JWT. El de acceso dura poco (15 min por defecto); el de refresco permite renovarlo sin volver a iniciar sesión.
// Ambos solo llevan el id del usuario: el rol y el estado se consultan en cada petición.
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { env } = require("../configuracion/entorno");
const HttpError = require("../utilidades/error-http");

function issueTokens(user) {
  const accessToken = jwt.sign({ sub: user.id }, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
  const refreshToken = jwt.sign({ sub: user.id, jti: crypto.randomUUID() }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  });
  return { accessToken, refreshToken };
}

// Devuelve el id del usuario dueño del token.
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.jwt.secret).sub;
  } catch {
    throw HttpError.unauthorized("Token inválido o expirado");
  }
}

function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, env.jwt.refreshSecret).sub;
  } catch {
    throw HttpError.unauthorized("Refresh token inválido o expirado");
  }
}

module.exports = { issueTokens, verifyAccessToken, verifyRefreshToken };
