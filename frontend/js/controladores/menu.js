import { renderLayout } from "../vistas/componentes.js";
import { session, preferences } from "../modelos/sesion.js";
import { SESSION_EXPIRED_EVENT } from "../modelos/api.js";
import { getHealth } from "./panel.js";
import { stream } from "../modelos/eventos.js";
import { toast } from "../utilidades.js";

const LOGIN_ROUTE = "#/login";
const HEALTH_REFRESH_MS = 60000;

let unsubscribe = null;
let healthTimer = null;

function toggleTheme() {
  const next = preferences.getTheme() === "light" ? "dark" : "light";
  preferences.setTheme(next);
  document.documentElement.dataset.theme = next;
  window.dispatchEvent(new CustomEvent("theme:changed", { detail: next }));
  return next;
}

export function hideLayout() {
  unsubscribe?.();
  unsubscribe = null;
  clearInterval(healthTimer);
  healthTimer = null;
  stream.disconnect();
}

function logout() {
  hideLayout();
  session.clear();
  location.hash = LOGIN_ROUTE;
}

// sesión vencida: aviso y vuelve al login
window.addEventListener(SESSION_EXPIRED_EVENT, () => {
  hideLayout();
  toast.error("Tu sesión expiró, inicia sesión de nuevo");
  location.hash = LOGIN_ROUTE;
});

export function showLayout(root) {
  hideLayout();
  const layout = renderLayout(
    root,
    { user: session.getUser(), isAdmin: session.isAdmin(), theme: preferences.getTheme() },
    { onToggleTheme: toggleTheme, onLogout: logout }
  );

  async function refreshHealth() {
    try {
      const health = await getHealth();
      layout.setHealth(health.status === "online" ? "online" : "degraded");
    } catch {
      layout.setHealth("offline");
    }
  }
  refreshHealth();
  healthTimer = setInterval(refreshHealth, HEALTH_REFRESH_MS);

  if (session.isAdmin()) {
    layout.setStreamStatus(stream.getState().status);
    unsubscribe = stream.subscribe((event) => {
      if (event.name !== "stream:status") return;
      layout.setStreamStatus(event.data.status);
      refreshHealth();
    });
    stream.connect();
  }
  return layout;
}
