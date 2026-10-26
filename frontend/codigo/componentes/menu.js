// Menú lateral y área de contenido de las páginas privadas. Recibe los datos y las acciones; no conoce la sesión.
import { el, initials } from "../utilidades/dom.js";
import { icon } from "../utilidades/iconos.js";

const MENU = [
  { route: "#/dashboard", icon: "chart", label: "Dashboard" },
  { route: "#/users", icon: "users", label: "Usuarios", adminOnly: true },
  { route: "#/monitoring", icon: "link", label: "Monitoreo" },
  { route: "#/profile", icon: "shield", label: "Mi perfil" },
];

const themeLabel = (theme) => (theme === "light" ? "Modo oscuro" : "Modo claro");

/**
 * Dibuja el layout y devuelve el contenedor donde se pinta cada página.
 * @param {HTMLElement} root
 * @param {{ user: object, isAdmin: boolean, theme: string }} data
 * @param {{ onToggleTheme: () => string, onLogout: () => void }} handlers
 */
export function renderLayout(root, { user, isAdmin, theme }, { onToggleTheme, onLogout }) {
  const nav = el("nav", {}, MENU
    .filter((item) => !item.adminOnly || isAdmin)
    .map((item) => el("a", { href: item.route, class: "nav-item", "data-route": item.route }, [
      icon(item.icon, "nav-icon"),
      el("span", {}, [item.label]),
    ])));

  const themeButton = el("button", { type: "button", class: "btn btn-ghost full" }, [themeLabel(theme)]);
  themeButton.addEventListener("click", () => {
    themeButton.textContent = themeLabel(onToggleTheme());
  });

  const sidebar = el("aside", { class: "sidebar" }, [
    el("div", { class: "brand" }, [icon("logo", "brand-dot"), el("span", {}, ["AXON"])]),
    el("div", { class: "nav-section" }, ["Principal"]),
    nav,
    el("div", { class: "user-block" }, [
      el("div", { class: "avatar" }, [initials(user?.name)]),
      el("div", {}, [el("div", { class: "name" }, [user?.name || "—"]), el("div", { class: "role" }, [user?.role || ""])]),
    ]),
    el("div", { class: "sidebar-footer" }, [
      themeButton,
      el("button", { type: "button", class: "btn btn-ghost full", onclick: onLogout }, [
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
