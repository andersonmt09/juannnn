// Cliente HTTP de la API de la base de datos externa.
// El proyecto no contiene SQL ni se conecta directamente a la base: los modelos
// piden y guardan los datos llamando a esta API (DATABASE_API_URL en backend/.env).
const { env } = require("../configuracion/entorno");
const HttpError = require("../utilidades/error-http");

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
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.databaseApi.key,
      },
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
    throw new HttpError(502, data?.message || `La base de datos externa respondió ${response.status}`);
  }
  return data;
}

const databaseClient = {
  get: (path, query) => request("GET", path, { query }),
  find: (path, query) => request("GET", path, { query, allowNotFound: true }),
  post: (path, body) => request("POST", path, { body }),
  patch: (path, body) => request("PATCH", path, { body }),
  delete: (path) => request("DELETE", path),
  ping: () => request("GET", "/health"),
};

module.exports = databaseClient;
