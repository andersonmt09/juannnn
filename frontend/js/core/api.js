const API_BASE = (window.APP_CONFIG && window.APP_CONFIG.API_BASE) || "http://localhost:4000/api";

function getAccessToken(){ return localStorage.getItem("axon_token"); }
function getRefreshToken(){ return localStorage.getItem("axon_refresh"); }
function setTokens(t, r){ if(t) localStorage.setItem("axon_token", t); if(r) localStorage.setItem("axon_refresh", r); }
function clearTokens(){ localStorage.removeItem("axon_token"); localStorage.removeItem("axon_refresh"); localStorage.removeItem("axon_user"); }
function getUser(){ try { return JSON.parse(localStorage.getItem("axon_user")||"null"); } catch(e){ return null; } }
function setUser(u){ localStorage.setItem("axon_user", JSON.stringify(u)); }

async function refreshAccessToken() {
  const rt = getRefreshToken();
  if (!rt) return false;
  try {
    const res = await fetch(API_BASE + "/auth/refresh-token", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) { clearTokens(); return false; }
    const data = await res.json();
    setTokens(data.token, data.refreshToken);
    if (data.user) setUser(data.user);
    return true;
  } catch(e) { return false; }
}

async function apiRequest(path, options = {}, retry = true) {
  const opts = { ...options };
  opts.headers = { ...(options.headers || {}) };
  const token = getAccessToken();
  if (token) opts.headers["Authorization"] = "Bearer " + token;
  if (opts.body && typeof opts.body === "object" && !(opts.body instanceof FormData)) {
    opts.headers["Content-Type"] = opts.headers["Content-Type"] || "application/json";
    opts.body = JSON.stringify(opts.body);
  }
  const res = await fetch(API_BASE + path, opts);
  if (res.status === 401 && retry) {
    const ok = await refreshAccessToken();
    if (ok) return apiRequest(path, options, false);
  }
  let data = null;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) data = await res.json();
  else data = await res.text();
  if (!res.ok) {
    const msg = (data && data.message) || res.statusText || "Error de solicitud";
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

window.API = { request: apiRequest, getAccessToken, getRefreshToken, setTokens, clearTokens, getUser, setUser };
