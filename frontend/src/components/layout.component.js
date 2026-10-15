// Menú lateral y área de contenido de las páginas privadas.
import { el, initials } from "../utils/dom.js";
import { icon } from "../utils/icons.js";
import { session } from "../store/session.store.js";

const MENU = [
  { route: "#/dashboard", icon: "chart", label: "Dashboard" },
  { route: "#/users", icon: "users", label: "Usuarios", adminOnly: true },
  { route: "#/endpoints", icon: "link", label: "Endpoints" },
  { route: "#/profile", icon: "shield", label: "Mi perfil" },
];

function logout() {
  session.clear();
  location.hash = "#/login";
}

function themeButton() {
  const label = () => (document.documentElement.dataset.theme === "light" ? "Modo oscuro" : "Modo claro");
  const button = el("button", { type: "button", class: "btn btn-ghost full" }, [label()]);
  button.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    session.setTheme(next);
    button.textContent = label();
  });
  return button;
}

// Dibuja el layout y devuelve el contenedor donde se pinta cada vista.
export function renderLayout(root) {
  const user = session.getUser();

  const nav = el("nav", {}, MENU
    .filter((item) => !item.adminOnly || session.isAdmin())
    .map((item) => el("a", { href: item.route, class: "nav-item", "data-route": item.route }, [
      icon(item.icon, "nav-icon"),
      el("span", {}, [item.label]),
    ])));

  const sidebar = el("aside", { class: "sidebar" }, [
    el("div", { class: "brand" }, [icon("logo", "brand-dot"), el("span", {}, ["AXON"])]),
    el("div", { class: "nav-section" }, ["Principal"]),
    nav,
    el("div", { class: "user-block" }, [
      el("div", { class: "avatar" }, [initials(user?.name)]),
      el("div", {}, [el("div", { class: "name" }, [user?.name || "—"]), el("div", { class: "role" }, [user?.role || ""])]),
    ]),
    el("div", { class: "sidebar-footer" }, [
      themeButton(),
      el("button", { type: "button", class: "btn btn-ghost full", onclick: logout }, [
        icon("logout", "nav-icon"), " Cerrar sesión",
      ]),
    ]),
  ]);

  const content = el("div", { id: "page" });
  root.replaceChildren(el("div", { class: "shell" }, [sidebar, el("main", { class: "main" }, [content])]));
  return content;
}

// Marca como activa la opción del menú de la ruta actual.
export function setActiveMenu(route) {
  document.querySelectorAll(".sidebar .nav-item").forEach((link) => {
    link.classList.toggle("active", link.dataset.route === route);
  });
}
