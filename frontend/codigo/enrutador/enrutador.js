// Decide qué controlador atiende la ruta actual, protege las rutas privadas y arma el menú.
import { ROUTES, DEFAULT_PUBLIC_ROUTE, DEFAULT_PRIVATE_ROUTE } from "./rutas.js";
import { session } from "../modelos/sesion.js";
import { preferences } from "../modelos/preferencias.js";
import { logout, toggleTheme } from "../controladores/sesion.js";
import { renderLayout, setActiveMenu } from "../componentes/menu.js";
import { SESSION_EXPIRED_EVENT } from "../servicios/cliente-http.js";
import { el } from "../utilidades/dom.js";

function resolve(hash) {
  const loggedIn = session.isLoggedIn();
  const route = ROUTES[hash];

  if (!route) return loggedIn ? DEFAULT_PRIVATE_ROUTE : DEFAULT_PUBLIC_ROUTE;
  if (!route.public && !loggedIn) return DEFAULT_PUBLIC_ROUTE;
  if (route.public && loggedIn) return DEFAULT_PRIVATE_ROUTE;
  if (route.adminOnly && !session.isAdmin()) return DEFAULT_PRIVATE_ROUTE;
  return hash;
}

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

export function startRouter() {
  window.addEventListener("hashchange", navigate);
  window.addEventListener(SESSION_EXPIRED_EVENT, () => { location.hash = DEFAULT_PUBLIC_ROUTE; });
  navigate();
}
