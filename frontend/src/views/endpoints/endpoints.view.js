/**
 * VISTA: Endpoints monitoreados   ruta: #/endpoints
 * RF-12 listar · RF-13 crear/eliminar (solo administrador)
 */
import { el } from "../../utils/dom.js";
import { toast } from "../../utils/toast.js";
import { endpointService } from "../../services/endpoint.service.js";
import { session } from "../../services/session.service.js";
import { pageHeader } from "../../components/page-header.component.js";
import { emptyState } from "../../components/empty-state.component.js";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export async function renderEndpointsView(container) {
  const isAdmin = session.isAdmin();
  const tablePanel = el("div", { class: "panel" }, [el("p", { class: "muted" }, ["Cargando..."])]);

  // ----- Formulario (solo admin) -----
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

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await endpointService.create(Object.fromEntries(new FormData(form)));
      toast.success("Endpoint creado");
      form.reset();
      formPanel.classList.add("hidden");
      await loadEndpoints();
    } catch (error) {
      toast.error(error.message);
    }
  });

  // ----- Tabla -----
  async function removeEndpoint(endpoint) {
    if (!confirm(`¿Eliminar el endpoint "${endpoint.name}"?`)) return;
    try {
      await endpointService.remove(endpoint.id);
      toast.success("Endpoint eliminado");
      await loadEndpoints();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function loadEndpoints() {
    try {
      const endpoints = await endpointService.list();
      if (!endpoints.length) {
        tablePanel.replaceChildren(emptyState("Sin endpoints", "Aún no hay endpoints registrados."));
        return;
      }
      const headers = ["ID", "Nombre", "Ruta", "Método", "Descripción", ...(isAdmin ? ["Acciones"] : [])];
      const rows = endpoints.map((ep) => el("tr", {}, [
        el("td", {}, [String(ep.id)]),
        el("td", {}, [ep.name]),
        el("td", { class: "mono small" }, [ep.path]),
        el("td", {}, [el("span", { class: `badge method-${ep.method}` }, [ep.method])]),
        el("td", { class: "small" }, [ep.description || ""]),
        isAdmin ? el("td", {}, [el("button", { class: "btn btn-sm btn-danger", onclick: () => removeEndpoint(ep) }, ["Eliminar"])]) : null,
      ]));
      tablePanel.replaceChildren(el("table", { class: "table" }, [
        el("thead", {}, [el("tr", {}, headers.map((h) => el("th", {}, [h])))]),
        el("tbody", {}, rows),
      ]));
    } catch (error) {
      tablePanel.replaceChildren(el("p", { class: "muted" }, ["Error al cargar endpoints."]));
      toast.error(error.message);
    }
  }

  const actions = isAdmin
    ? [el("button", { class: "btn btn-primary", onclick: () => formPanel.classList.toggle("hidden") }, ["+ Nuevo"])]
    : [];

  container.replaceChildren(pageHeader("Endpoints", "Endpoints registrados para monitoreo", actions), formPanel, tablePanel);
  await loadEndpoints();
}
