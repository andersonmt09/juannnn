// conexión con la API de la base de datos externa (HTTP, sin SQL)
const { env, HttpError } = require("./configuracion");

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

// tiempo de respuesta de la base, para el estado del sistema
async function pingDatabase() {
  const startedAt = performance.now();
  let available = true;
  try {
    await db.ping();
  } catch {
    available = false;
  }
  return { available, latencyMs: Math.round(performance.now() - startedAt) };
}

// catálogos (roles, estados, métodos...): caché en memoria que traduce valor <-> id
class Catalog {
  constructor(resource, field = "name") {
    this.resource = resource;
    this.field = field;
    this.loading = null;
  }

  // carga una sola vez; reload() la vuelve a pedir
  load() {
    this.loading ??= db.get(this.resource, { limit: 100 })
      .then(({ data }) => ({
        ids: new Map(data.map((row) => [String(row[this.field]), row.id])),
        values: new Map(data.map((row) => [Number(row.id), row[this.field]])),
      }))
      .catch((error) => { this.loading = null; throw error; });
    return this.loading;
  }

  reload() {
    this.loading = null;
    return this.load();
  }

  // si no existe y llegan extra, se crea en la base
  async idOf(value, extra) {
    let { ids } = await this.load();
    if (!ids.has(String(value)) && extra) {
      // 409 = otra petición lo creó antes: basta recargar
      await db.post(this.resource, { [this.field]: value, ...extra }).catch((error) => { if (error.statusCode !== 409) throw error; });
      ({ ids } = await this.reload());
    }
    if (!ids.has(String(value))) throw new HttpError(502, `Valor desconocido en ${this.resource}: ${value}`);
    return ids.get(String(value));
  }

  async valueOf(id) {
    let { values } = await this.load();
    if (!values.has(Number(id))) ({ values } = await this.reload());
    return values.get(Number(id)) ?? null;
  }
}

module.exports = { db, pingDatabase, Catalog };
