// Punto de entrada del frontend: solo es el router. Define las pantallas (#/...),
// decide cuál mostrar según la sesión y el rol, y limpia la pantalla anterior al cambiar.
import { showLogin } from "./controladores/inicio-sesion.js";
import { showRegister } from "./controladores/registro.js";
import { showForgotPassword } from "./controladores/recuperar-contrasena.js";
import { showVerify } from "./controladores/verificacion.js";
import { showDashboard } from "./controladores/panel.js";
import { showUsers } from "./controladores/usuarios.js";
import { showMonitoring } from "./controladores/monitoreo.js";
import { showActivity } from "./controladores/actividad.js";
import { showProfile } from "./controladores/perfil.js";
import { showLayout, hideLayout } from "./controladores/menu.js";
import { session, preferences } from "./modelos/sesion.js";
import { el } from "./utilidades.js";

// ---------- Pantallas ----------
// public = sin sesión, adminOnly = solo administradores.

const ROUTES = {
  "#/login":      { controller: showLogin,      public: true },
  "#/register":   { controller: showRegister,   public: true },
  "#/verify":     { controller: showVerify,     public: true },
  "#/forgot-password": { controller: showForgotPassword, public: true },
  "#/dashboard":  { controller: showDashboard,  adminOnly: true },
  "#/users":      { controller: showUsers,      adminOnly: true },
  "#/monitoring": { controller: showMonitoring },
  "#/activity":   { controller: showActivity,   adminOnly: true },
  "#/profile":    { controller: showProfile },
};

const DEFAULT_PUBLIC_ROUTE = "#/login";

// El administrador entra al panel; el usuario común, a monitoreo.
const defaultPrivateRoute = () => (session.isAdmin() ? "#/dashboard" : "#/monitoring");

// ---------- Navegación ----------

// Devuelve la ruta que corresponde mostrar según la sesión y el rol.
function resolve(hash) {
  const loggedIn = session.isLoggedIn();
  const route = ROUTES[hash];

  if (!route) return loggedIn ? defaultPrivateRoute() : DEFAULT_PUBLIC_ROUTE;
  if (!route.public && !loggedIn) return DEFAULT_PUBLIC_ROUTE;
  if (route.public && loggedIn) return defaultPrivateRoute();
  if (route.adminOnly && !session.isAdmin()) return defaultPrivateRoute();
  return hash;
}

let layout = null;      // layout privado actual (se dibuja una sola vez)
let cleanup = null;     // limpieza de la pantalla actual
let navigation = 0;     // número de navegación, para ignorar controladores lentos

function runCleanup() {
  try { cleanup?.(); } catch { /* una limpieza rota no debe bloquear la navegación */ }
  cleanup = null;
}

// Un controlador puede devolver (o resolver) una función de limpieza.
function mount(controller, container) {
  const current = ++navigation;
  Promise.resolve(controller(container)).then((result) => {
    if (typeof result !== "function") return;
    if (current === navigation) cleanup = result;
    else result(); // el usuario ya cambió de pantalla
  }).catch(() => { /* cada controlador muestra sus propios errores */ });
}

function navigate() {
  const root = document.getElementById("app");
  const target = resolve(location.hash);
  if (target !== location.hash) {
    location.hash = target; // vuelve a llamar a navigate()
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

// ---------- Inicio ----------

document.documentElement.dataset.theme = preferences.getTheme();
window.addEventListener("hashchange", navigate);
navigate();
