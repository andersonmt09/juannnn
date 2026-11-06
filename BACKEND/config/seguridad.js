// tokens JWT de acceso y de renovación
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { env, HttpError } = require("./configuracion");

// el token lleva id y versión; si cambia token_version dejan de servir
const tokens = {
  issue(user) {
    const accessToken = jwt.sign({ sub: user.id, ver: user.tokenVersion || 0 }, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
    const refreshToken = jwt.sign({ sub: user.id, ver: user.tokenVersion || 0, jti: crypto.randomUUID() }, env.jwt.refreshSecret, {
      expiresIn: env.jwt.refreshExpiresIn,
    });
    return { accessToken, refreshToken, expiresAt: new Date(jwt.decode(refreshToken).exp * 1000) };
  },

  verifyAccess(token) {
    try {
      const payload = jwt.verify(token, env.jwt.secret);
      return { id: payload.sub, ver: payload.ver || 0 };
    } catch {
      throw HttpError.unauthorized("Token inválido o expirado");
    }
  },
  verifyRefresh(token) {
    try {
      const payload = jwt.verify(token, env.jwt.refreshSecret);
      return { id: payload.sub, ver: payload.ver || 0 };
    } catch {
      throw HttpError.unauthorized("Refresh token inválido o expirado");
    }
  },
};

module.exports = { tokens };
