/**
 * Enrutador (SPA con rutas #/...).
 * Decide qué vista mostrar según la URL y si hay sesión iniciada.
 */
import { ROUTES, DEFAULT_PUBLIC_ROUTE, DEFAULT_PRIVATE_ROUTE } from "./routes.js";
import { session } from "../services/session.service.js";
import { renderLayout, setActiveMenu } from "../components/layout.component.js";
import { el } from "../utils/dom.js";

function resolve(hash) {
  const loggedIn = session.isLoggedIn();
  const route = ROUTES[hash];

  if (!route) return loggedIn ? DEFAULT_PRIVATE_ROUTE : DEFAULT_PUBLIC_ROUTE;
  if (!route.public && !loggedIn) return DEFAULT_PUBLIC_ROUTE;
  if (route.public && loggedIn) return DEFAULT_PRIVATE_ROUTE;
  if (route.adminOnly && !session.isAdmin()) return DEFAULT_PRIVATE_ROUTE;
  return hash;
}

function navigate() {
  const root = document.getElementById("app");
  const target = resolve(location.hash);
  if (target !== location.hash) {
    location.hash = target; // dispara de nuevo navigate()
    return;
  }

  const route = ROUTES[target];
  if (route.public) {
    const container = el("div", { id: "auth-container" });
    root.replaceChildren(container);
    route.view(container);
    return;
  }

  const content = document.getElementById("page") || renderLayout(root);
  setActiveMenu(target);
  route.view(content);
}

export function startRouter() {
  window.addEventListener("hashchange", navigate);
  navigate();
}
