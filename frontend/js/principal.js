// Punto de entrada del frontend: define las pantallas (#/...), decide cuál mostrar,
// protege las privadas y arma el menú. También maneja el tema y el cierre de sesión.
import { showLogin } from "./controladores/inicio-sesion.js";
import { showRegister } from "./controladores/registro.js";
import { showVerify } from "./controladores/verificacion.js";
import { showDashboard } from "./controladores/panel.js";
import { showUsers } from "./controladores/usuarios.js";
import { showMonitoring } from "./controladores/monitoreo.js";
import { showProfile } from "./controladores/perfil.js";
import { session, preferences } from "./modelos/sesion.js";
import { SESSION_EXPIRED_EVENT } from "./modelos/api.js";
import { renderLayout, setActiveMenu } from "./vistas/componentes.js";
import { el } from "./utilidades.js";

// ---------- Pantallas ----------
// public = sin sesión, adminOnly = solo administradores.

const ROUTES = {
  "#/login":      { controller: showLogin,      public: true },
  "#/register":   { controller: showRegister,   public: true },
  "#/verify":     { controller: showVerify,     public: true },
  "#/dashboard":  { controller: showDashboard },
  "#/users":      { controller: showUsers,      adminOnly: true },
  "#/monitoring": { controller: showMonitoring },
  "#/profile":    { controller: showProfile },
};

const DEFAULT_PUBLIC_ROUTE = "#/login";
const DEFAULT_PRIVATE_ROUTE = "#/dashboard";

// ---------- Tema y sesión ----------

function applySavedTheme() {
  document.documentElement.dataset.theme = preferences.getTheme();
}

// Alterna entre claro y oscuro y devuelve el tema nuevo.
function toggleTheme() {
  const next = preferences.getTheme() === "light" ? "dark" : "light";
  preferences.setTheme(next);
  document.documentElement.dataset.theme = next;
  return next;
}

function logout() {
  session.clear();
  location.hash = DEFAULT_PUBLIC_ROUTE;
}

// ---------- Navegación ----------

// Devuelve la ruta que corresponde mostrar según la sesión y el rol.
function resolve(hash) {
  const loggedIn = session.isLoggedIn();
  const route = ROUTES[hash];

  if (!route) return loggedIn ? DEFAULT_PRIVATE_ROUTE : DEFAULT_PUBLIC_ROUTE;
  if (!route.public && !loggedIn) return DEFAULT_PUBLIC_ROUTE;
  if (route.public && loggedIn) return DEFAULT_PRIVATE_ROUTE;
  if (route.adminOnly && !session.isAdmin()) return DEFAULT_PRIVATE_ROUTE;
  return hash;
}

// Las páginas privadas comparten el menú lateral; solo se dibuja una vez.
function privateContainer(root) {
  const existing = document.getElementById("page");
  if (existing) return existing;
  return renderLayout(
    root,
    { user: session.getUser(), isAdmin: session.isAdmin(), theme: preferences.getTheme() },
    { onToggleTheme: toggleTheme, onLogout: logout }
  );
}

function navigate() {
  const root = document.getElementById("app");
  const target = resolve(location.hash);
  if (target !== location.hash) {
    location.hash = target; // vuelve a llamar a navigate()
    return;
  }

  const route = ROUTES[target];
  if (route.public) {
    const container = el("div", { id: "auth-container" });
    root.replaceChildren(container);
    route.controller(container);
    return;
  }

  const content = privateContainer(root);
  setActiveMenu(target);
  route.controller(content);
}

// ---------- Inicio ----------

applySavedTheme();
window.addEventListener("hashchange", navigate);
window.addEventListener(SESSION_EXPIRED_EVENT, () => { location.hash = DEFAULT_PUBLIC_ROUTE; });
navigate();
