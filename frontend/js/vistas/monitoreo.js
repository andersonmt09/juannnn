// Vista de monitoreo (#/monitoring): tabla de endpoints vigilados con sus estadísticas reales.
// El formulario para agregar y los botones de quitar solo se dibujan para administradores.
import { pageHeader, emptyState } from "./componentes.js";
import { el, formatDate } from "../utilidades.js";

const HIGH_ERROR_RATE = 0.2; // 20 % o más de respuestas con error se resalta

// "2 · 29 %": errores y porcentaje sobre el total de peticiones.
function errorsCell({ requests, errors }) {
  const rate = requests ? errors / requests : 0;
  return el("span", { class: rate >= HIGH_ERROR_RATE ? "error-rate-high" : "" }, [`${errors} · ${Math.round(rate * 100)} %`]);
}

/**
 * @param {HTMLElement} container
 * @param {{ canManage: boolean }} data
 * @param {{ onOpenForm: () => void, onSave: (data: object) => void, onDelete: (endpoint: object) => void, onRefresh: () => void }} handlers
 */
export function renderMonitoringView(container, { canManage }, handlers) {
  const tablePanel = el("div", { class: "panel" }, [el("p", { class: "muted" }, ["Cargando..."])]);

  const routeSelect = el("select", { id: "mon-route", name: "route", required: true });
  const form = el("form", {}, [
    el("label", { for: "mon-route" }, ["Ruta de la API"]),
    routeSelect,
    el("label", { for: "mon-name" }, ["Nombre"]),
    el("input", { id: "mon-name", name: "name", required: true, placeholder: "Ej.: Inicio de sesión" }),
    el("label", { for: "mon-description" }, ["Descripción"]),
    el("input", { id: "mon-description", name: "description" }),
    el("div", { class: "row" }, [
      el("button", { type: "submit", class: "btn btn-primary" }, ["Monitorear"]),
      el("button", { type: "button", class: "btn", onclick: () => formPanel.classList.add("hidden") }, ["Cancelar"]),
    ]),
  ]);
  const formPanel = el("div", { class: "panel hidden" }, [el("h3", {}, ["Agregar endpoint al monitoreo"]), form]);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const { route, name, description } = Object.fromEntries(new FormData(form));
    const [method, path] = route.split(" ");
    handlers.onSave({ method, path, name, description });
  });

  const actions = [el("button", { class: "btn", onclick: handlers.onRefresh }, ["Actualizar"])];
  if (canManage) actions.push(el("button", { class: "btn btn-primary", onclick: handlers.onOpenForm }, ["+ Agregar"]));

  container.replaceChildren(...[
    pageHeader("Monitoreo", "Peticiones, errores y latencia de los endpoints vigilados", actions),
    canManage ? formPanel : null,
    tablePanel,
  ].filter(Boolean));

  return {
    showEndpoints(endpoints) {
      if (!endpoints.length) {
        const hint = canManage ? "Agrega una ruta de la API para empezar a vigilarla." : "Un administrador aún no ha agregado endpoints.";
        tablePanel.replaceChildren(emptyState("Sin endpoints monitoreados", hint));
        return;
      }
      const headers = ["Nombre", "Método", "Ruta", "Peticiones", "Errores", "Latencia prom.", "Última petición"];
      if (canManage) headers.push("Acciones");

      const rows = endpoints.map((ep) => el("tr", {}, [
        el("td", {}, [ep.name, ep.description ? el("div", { class: "muted small" }, [ep.description]) : null]),
        el("td", {}, [el("span", { class: `badge method-${ep.method}` }, [ep.method])]),
        el("td", { class: "mono small" }, [ep.path]),
        el("td", {}, [String(ep.stats.requests)]),
        el("td", {}, [errorsCell(ep.stats)]),
        el("td", { class: "small" }, [`${ep.stats.avgLatencyMs} ms`]),
        el("td", { class: "small" }, [formatDate(ep.stats.lastRequestAt)]),
        canManage ? el("td", {}, [el("button", { class: "btn btn-sm btn-danger", onclick: () => handlers.onDelete(ep) }, ["Quitar"])]) : null,
      ]));
      tablePanel.replaceChildren(el("table", { class: "table" }, [
        el("thead", {}, [el("tr", {}, headers.map((h) => el("th", {}, [h])))]),
        el("tbody", {}, rows),
      ]));
    },

    showError() {
      tablePanel.replaceChildren(el("p", { class: "muted" }, ["Error al cargar el monitoreo."]));
    },

    // routes: rutas de la API que todavía no se monitorean.
    openForm(routes) {
      routeSelect.replaceChildren(...routes.map(({ method, path }) =>
        el("option", { value: `${method} ${path}` }, [`${method} ${path}`])));
      form.reset();
      formPanel.classList.remove("hidden");
    },

    closeForm() {
      form.reset();
      formPanel.classList.add("hidden");
    },
  };
}
