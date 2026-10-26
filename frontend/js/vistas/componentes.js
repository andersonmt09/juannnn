// Piezas visuales reutilizables por las vistas: encabezado, estado vacío, modal, paginación, gráfica y menú.
import { el, initials, icon } from "../utilidades.js";

// ---------- Encabezado de página ----------

export function pageHeader(title, subtitle = "", actions = []) {
  return el("div", { class: "page-header row-between" }, [
    el("div", {}, [el("h2", {}, [title]), subtitle ? el("div", { class: "page-subtitle" }, [subtitle]) : null]),
    el("div", { class: "row" }, actions),
  ]);
}

// ---------- Estado vacío ----------

export function emptyState(title, text) {
  return el("div", { class: "empty" }, [el("h4", {}, [title]), el("p", {}, [text])]);
}

// ---------- Ventana modal ----------

/**
 * @param {string} title
 * @param {HTMLElement} body  contenido (normalmente un formulario)
 * @returns {{ element: HTMLElement, open: Function, close: Function, setTitle: Function }}
 */
export function createModal(title, body) {
  const heading = el("h3", {}, [title]);
  const element = el("div", { class: "modal hidden" }, [
    el("div", { class: "modal-backdrop", onclick: () => close() }),
    el("div", { class: "modal-card" }, [heading, body]),
  ]);

  const open = () => element.classList.remove("hidden");
  const close = () => element.classList.add("hidden");
  const setTitle = (text) => { heading.textContent = text; };

  return { element, open, close, setTitle };
}

// ---------- Paginación ----------

/**
 * @param {{ page: number, totalPages: number, total: number }} meta
 * @param {(page: number) => void} onChange
 */
export function pagination({ page, totalPages, total }, onChange) {
  if (totalPages <= 1) return el("div", { class: "pagination" }, [`${total} en total`]);

  return el("div", { class: "pagination" }, [
    el("button", { class: "btn btn-sm", disabled: page <= 1, onclick: () => onChange(page - 1) }, ["Anterior"]),
    el("span", {}, [`Página ${page} de ${totalPages} · ${total} en total`]),
    el("button", { class: "btn btn-sm", disabled: page >= totalPages, onclick: () => onChange(page + 1) }, ["Siguiente"]),
  ]);
}

// ---------- Gráfica de dona (Chart.js) ----------

const PALETTE = ["#3dd6c6", "#4ade80", "#f4b942", "#ff6b7a", "#6ae3d6", "#9aa0c3"];

export function doughnutChart(title, items) {
  const canvas = el("canvas", { height: "200" });
  const panel = el("div", { class: "panel" }, [el("h3", {}, [title]), canvas]);

  if (!items.length) {
    canvas.replaceWith(el("p", { class: "muted small" }, ["Sin datos todavía."]));
  } else if (window.Chart) {
    new window.Chart(canvas.getContext("2d"), {
      type: "doughnut",
      data: {
        labels: items.map((i) => i.label),
        datasets: [{ data: items.map((i) => i.value), backgroundColor: PALETTE, borderWidth: 0 }],
      },
      options: {
        cutout: "68%",
        plugins: { legend: { position: "bottom", labels: { color: "#9aa0c3", boxWidth: 12, font: { size: 11 } } } },
      },
    });
  }
  return panel;
}

// ---------- Menú lateral y estructura de las páginas privadas ----------

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
