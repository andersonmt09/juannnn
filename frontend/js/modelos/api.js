// cliente HTTP del backend (/api): agrega el token y lo renueva si vence
import { session } from "./sesion.js";
import { RefreshTokenRequestDto } from "../dto/autenticacion.js";

const API_BASE_URL = "/api";

export const SESSION_EXPIRED_EVENT = "session:expired";

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

// una sola renovación a la vez
let refreshing = null;

export const REFRESH = Object.freeze({ OK: "ok", INVALID: "invalid", UNAVAILABLE: "unavailable" });

function expireSession() {
  session.clear();
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
}

// renueva los tokens; solo cierra la sesión si el servidor responde 401/403
export function ensureFreshSession() {
  refreshing ??= (async () => {
    const refreshToken = session.getRefreshToken();
    if (!refreshToken) {
      if (session.getAccessToken()) expireSession();
      return REFRESH.INVALID;
    }
    try {
      session.save(await refreshSession(new RefreshTokenRequestDto({ refreshToken })));
      return REFRESH.OK;
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        expireSession();
        return REFRESH.INVALID;
      }
      return REFRESH.UNAVAILABLE;
    }
  })().finally(() => { refreshing = null; });
  return refreshing;
}

// fetch directo para no entrar en un ciclo de renovaciones
async function refreshSession(dto) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto),
    });
  } catch {
    throw new ApiError("No se pudo conectar con la API", 0);
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(data?.message || "No se pudo renovar la sesión", response.status, data);
  return data;
}

export async function request(method, path, body, canRetry = true) {
  const headers = { "Content-Type": "application/json" };
  const token = session.getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("No se pudo conectar con la API", 0);
  }

  if (response.status === 401 && token && canRetry) {
    const current = session.getAccessToken();
    if (current && current !== token) return request(method, path, body, false);
    const result = await ensureFreshSession();
    if (result === REFRESH.OK) return request(method, path, body, false);
    if (result === REFRESH.UNAVAILABLE) throw new ApiError("No se pudo renovar la sesión, intenta de nuevo", 503);
    throw new ApiError("Tu sesión expiró", 401);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(data?.message || "Error en la solicitud", response.status, data);
  }
  return data;
}

export const http = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  patch: (path, body) => request("PATCH", path, body),
  delete: (path) => request("DELETE", path),
};
