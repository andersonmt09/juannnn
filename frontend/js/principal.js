// punto de entrada: router de pantallas
import { showLogin } from "./controladores/inicio-sesion.js";
import { showRegister } from "./controladores/registro.js";
import { showVerify } from "./controladores/verificacion.js";
import { showDashboard } from "./controladores/panel.js";
import { showUsers } from "./controladores/usuarios.js";
import { showMonitoring } from "./controladores/monitoreo.js";
import { showActivity } from "./controladores/actividad.js";
import { showProfile } from "./controladores/perfil.js";
import { showLayout, hideLayout } from "./controladores/menu.js";
import { session, preferences } from "./modelos/sesion.js";
import { el } from "./utilidades.js";

// public = sin sesión, adminOnly = solo administradores

const ROUTES = {
  "#/login":      { controller: showLogin,      public: true },
  "#/register":   { controller: showRegister,   public: true },
  "#/verify":     { controller: showVerify,     public: true },
  "#/dashboard":  { controller: showDashboard,  adminOnly: true },
  "#/users":      { controller: showUsers,      adminOnly: true },
  "#/monitoring": { controller: showMonitoring },
  "#/activity":   { controller: showActivity,   adminOnly: true },
  "#/profile":    { controller: showProfile },
};

const DEFAULT_PUBLIC_ROUTE = "#/login";

const defaultPrivateRoute = () => (session.isAdmin() ? "#/dashboard" : "#/monitoring");

function resolve(hash) {
  const loggedIn = session.isLoggedIn();
  const route = ROUTES[hash];

  if (!route) return loggedIn ? defaultPrivateRoute() : DEFAULT_PUBLIC_ROUTE;
  if (!route.public && !loggedIn) return DEFAULT_PUBLIC_ROUTE;
  if (route.public && loggedIn) return defaultPrivateRoute();
  if (route.adminOnly && !session.isAdmin()) return defaultPrivateRoute();
  return hash;
}

let layout = null;
let cleanup = null;
let navigation = 0;     // para ignorar controladores lentos

function runCleanup() {
  try { cleanup?.(); } catch (error) { console.error("Error al limpiar la pantalla:", error); }
  cleanup = null;
}

function mount(controller, container) {
  const current = ++navigation;
  Promise.resolve(controller(container)).then((result) => {
    if (typeof result !== "function") return;
    if (current === navigation) cleanup = result;
    else result(); // el usuario ya cambió de pantalla
  }).catch((error) => { console.error("Error en la pantalla:", error); });
}

function navigate() {
  const root = document.getElementById("app");
  const target = resolve(location.hash);
  if (target !== location.hash) {
    location.hash = target;
    return;
  }

  runCleanup();
  const route = ROUTES[target];

  if (route.public) {
    if (layout) { hideLayout(); layout = null; }
    const container = el("div", { id: "auth-container" });
    root.replaceChildren(container);
    mount(route.controller, container);
    return;
  }

  if (!layout || !document.getElementById("page")) layout = showLayout(root);
  layout.setActive(target);
  layout.content.replaceChildren();
  window.scrollTo(0, 0);
  mount(route.controller, layout.content);
}

document.documentElement.dataset.theme = preferences.getTheme();
window.addEventListener("hashchange", navigate);
navigate();
