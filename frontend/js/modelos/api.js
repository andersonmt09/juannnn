// Cliente HTTP del backend (/api). Los endpoints viven en cada controlador (js/controladores).
// El cliente agrega el token, lo renueva una vez si expira y, si la sesión ya no es válida,
// avisa con el evento SESSION_EXPIRED_EVENT (lo atiende controladores/menu.js).
import { session } from "./sesion.js";
import { RefreshTokenRequestDto } from "../vistas/dto.js";

// ---------- Cliente HTTP ----------

const API_BASE_URL = "/api"; // el backend sirve el frontend: misma dirección

export const SESSION_EXPIRED_EVENT = "session:expired";

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

// Una sola renovación a la vez: si llegan varios 401 juntos, todos esperan la misma promesa.
let refreshing = null;

// Resultado de la renovación: vigente, inválida (401/403) o sin respuesta (red caída o 503).
export const REFRESH = Object.freeze({ OK: "ok", INVALID: "invalid", UNAVAILABLE: "unavailable" });

function expireSession() {
  session.clear();
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
}

/**
 * Renueva los tokens con el refresh token. Solo se cierra la sesión (y se avisa una vez)
 * si el servidor responde 401/403; por red o 503 la sesión se conserva.
 */
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

// POST /auth/refresh-token
// fetch directo (sin pasar por request) para no entrar en un ciclo de renovaciones.
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
    // Si otra petición ya renovó el token, solo se reintenta con el nuevo.
    const current = session.getAccessToken();
    if (current && current !== token) return request(method, path, body, false);
    const result = await ensureFreshSession();
    if (result === REFRESH.OK) return request(method, path, body, false);
    if (result === REFRESH.UNAVAILABLE) throw new ApiError("No se pudo renovar la sesión, intenta de nuevo", 503);
    throw new ApiError("Tu sesión expiró", 401); // INVALID: el aviso ya se emitió una sola vez
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(data?.message || "Error en la solicitud", response.status, data);
  }
  return data;
}

// Atajos para los controladores. body: un DTO de petición (ver vistas/dto.js).
export const http = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  patch: (path, body) => request("PATCH", path, body),
  delete: (path) => request("DELETE", path),
};
