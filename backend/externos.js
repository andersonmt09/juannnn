// sistemas externos: API de la base de datos, correo y JWT
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { env, HttpError, CODE_PURPOSE, SECURITY } = require("./configuracion");

function buildUrl(path, query) {
  const url = new URL(env.databaseApi.url.replace(/\/$/, "") + path);
  for (const [key, value] of Object.entries(query || {})) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  }
  return url;
}

async function request(method, path, { query, body, allowNotFound = false } = {}) {
  let response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers: { "Content-Type": "application/json", "x-api-key": env.databaseApi.key },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(env.databaseApi.timeoutMs),
    });
  } catch {
    throw new HttpError(503, "La base de datos externa no está disponible");
  }

  if (response.status === 404 && allowNotFound) return null;
  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 409) throw new HttpError(409, "El recurso ya existe");
    throw new HttpError(502, "La base de datos externa respondió con un error");
  }
  return data;
}

const db = {
  get: (path, query) => request("GET", path, { query }),
  find: (path, query) => request("GET", path, { query, allowNotFound: true }),
  post: (path, body) => request("POST", path, { body }),
  patch: (path, body) => request("PATCH", path, { body }),
  delete: (path) => request("DELETE", path),
  ping: () => request("GET", "/health"),
};

// sin SMTP configurado, el mensaje sale en la consola

const transporter = env.smtp.host
  ? nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    })
  : null;

const MAIL_SUBJECTS = {
  [CODE_PURPOSE.REGISTRATION]: "AXON Security · Código de verificación",
  [CODE_PURPOSE.LOGIN]: "AXON Security · Código de inicio de sesión",
};

const mail = {
  async sendVerificationCode(email, code, purpose) {
    const subject = MAIL_SUBJECTS[purpose] || MAIL_SUBJECTS[CODE_PURPOSE.LOGIN];
    const text = `Tu código de verificación es: ${code}\nExpira en ${SECURITY.CODE_EXPIRY_MINUTES} minutos.`;

    if (!transporter) {
      console.log("\n========== CORREO (modo desarrollo) ==========");
      console.log(`Para:   ${email}`);
      console.log(`Asunto: ${subject}`);
      console.log(`Código: ${code}`);
      console.log("===============================================\n");
      return;
    }
    await transporter.sendMail({ from: env.smtp.from, to: email, subject, text });
  },
};

// el token lleva id y versión; si cambia token_version dejan de servir

const tokens = {
  issue(user) {
    const accessToken = jwt.sign({ sub: user.id, ver: user.tokenVersion || 0 }, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
    const refreshToken = jwt.sign({ sub: user.id, ver: user.tokenVersion || 0, jti: crypto.randomUUID() }, env.jwt.refreshSecret, {
      expiresIn: env.jwt.refreshExpiresIn,
    });
    return { accessToken, refreshToken };
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

module.exports = { db, mail, tokens };
