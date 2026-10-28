// Controlador del layout privado: dibuja el menú, cambia el tema, cierra sesión y
// mantiene los indicadores de salud de la API y del stream en tiempo real.
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
  window.dispatchEvent(new CustomEvent("theme:changed", { detail: next })); // las gráficas se repintan
  return next;
}

/** Suelta el stream y los temporizadores del layout (al salir a una pantalla pública). */
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

// Sesión vencida (el refresco también falló): se avisa y se vuelve al login.
window.addEventListener(SESSION_EXPIRED_EVENT, () => {
  hideLayout();
  toast.error("Tu sesión expiró, inicia sesión de nuevo");
  location.hash = LOGIN_ROUTE;
});

/** Pinta el layout y devuelve { content, setActive, setHealth, setStreamStatus }. */
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

  // El tiempo real es solo para administradores.
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
