// Vista de endpoints monitoreados (#/endpoints). El formulario y los botones de eliminar solo se dibujan para administradores.
import { el } from "../utilidades/dom.js";
import { pageHeader } from "../componentes/encabezado.js";
import { emptyState } from "../componentes/estado-vacio.js";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

/**
 * @param {HTMLElement} container
 * @param {{ canManage: boolean }} data
 * @param {{ onSave: (data: object) => void, onDelete: (endpoint: object) => void }} handlers
 */
export function renderEndpointsView(container, { canManage }, handlers) {
  const tablePanel = el("div", { class: "panel" }, [el("p", { class: "muted" }, ["Cargando..."])]);

  const form = el("form", {}, [
    el("label", { for: "ep-name" }, ["Nombre"]),
    el("input", { id: "ep-name", name: "name", required: true }),
    el("label", { for: "ep-path" }, ["Ruta"]),
    el("input", { id: "ep-path", name: "path", required: true, placeholder: "/api/recurso" }),
    el("label", { for: "ep-method" }, ["Método"]),
    el("select", { id: "ep-method", name: "method" }, METHODS.map((m) => el("option", {}, [m]))),
    el("label", { for: "ep-description" }, ["Descripción"]),
    el("input", { id: "ep-description", name: "description" }),
    el("div", { class: "row" }, [
      el("button", { type: "submit", class: "btn btn-primary" }, ["Guardar"]),
      el("button", { type: "button", class: "btn", onclick: () => formPanel.classList.add("hidden") }, ["Cancelar"]),
    ]),
  ]);
  const formPanel = el("div", { class: "panel hidden" }, [el("h3", {}, ["Nuevo endpoint"]), form]);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    handlers.onSave(Object.fromEntries(new FormData(form)));
  });

  const actions = canManage
    ? [el("button", { class: "btn btn-primary", onclick: () => formPanel.classList.toggle("hidden") }, ["+ Nuevo"])]
    : [];

  const sections = [pageHeader("Endpoints", "Endpoints registrados para monitoreo", actions), tablePanel];
  if (canManage) sections.splice(1, 0, formPanel);
  container.replaceChildren(...sections);

  return {
    showEndpoints(endpoints) {
      if (!endpoints.length) {
        tablePanel.replaceChildren(emptyState("Sin endpoints", "Aún no hay endpoints registrados."));
        return;
      }
      const headers = ["ID", "Nombre", "Ruta", "Método", "Descripción", ...(canManage ? ["Acciones"] : [])];
      const rows = endpoints.map((ep) => el("tr", {}, [
        el("td", {}, [String(ep.id)]),
        el("td", {}, [ep.name]),
        el("td", { class: "mono small" }, [ep.path]),
        el("td", {}, [el("span", { class: `badge method-${ep.method}` }, [ep.method])]),
        el("td", { class: "small" }, [ep.description || ""]),
        canManage ? el("td", {}, [el("button", { class: "btn btn-sm btn-danger", onclick: () => handlers.onDelete(ep) }, ["Eliminar"])]) : null,
      ]));
      tablePanel.replaceChildren(el("table", { class: "table" }, [
        el("thead", {}, [el("tr", {}, headers.map((h) => el("th", {}, [h])))]),
        el("tbody", {}, rows),
      ]));
    },

    showError() {
      tablePanel.replaceChildren(el("p", { class: "muted" }, ["Error al cargar endpoints."]));
    },

    resetForm() {
      form.reset();
      formPanel.classList.add("hidden");
    },
  };
}
