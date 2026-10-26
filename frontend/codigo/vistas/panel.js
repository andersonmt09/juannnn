// Vista del panel de métricas (#/dashboard). Solo dibuja los datos que recibe.
import { el, formatDate } from "../utilidades/dom.js";
import { icon } from "../utilidades/iconos.js";
import { pageHeader } from "../componentes/encabezado.js";
import { doughnutChart } from "../componentes/grafica.js";
import { emptyState } from "../componentes/estado-vacio.js";

function summaryCard(label, value, iconName) {
  return el("div", { class: "card" }, [
    el("div", { class: "card-icon" }, [icon(iconName)]),
    el("div", { class: "card-value" }, [String(value)]),
    el("div", { class: "card-label" }, [label]),
  ]);
}

function recentRequestsTable(requests) {
  if (!requests.length) return emptyState("Sin actividad", "Aún no se registran peticiones a la API.");

  const rows = requests.map((r) => el("tr", {}, [
    el("td", {}, [el("span", { class: `badge method-${r.method}` }, [r.method])]),
    el("td", { class: "mono small" }, [r.path]),
    el("td", {}, [el("span", { class: `badge status-${Math.floor(r.statusCode / 100)}` }, [String(r.statusCode)])]),
    el("td", { class: "small" }, [`${r.latencyMs} ms`]),
    el("td", { class: "small" }, [formatDate(r.createdAt)]),
  ]));

  return el("table", { class: "table" }, [
    el("thead", {}, [el("tr", {}, ["Método", "Ruta", "Estado", "Latencia", "Fecha"].map((h) => el("th", {}, [h])))]),
    el("tbody", {}, rows),
  ]);
}

const header = (userName) => pageHeader("Dashboard", `Resumen del sistema - ${userName || ""}`);

export function renderDashboardLoading(container, { userName }) {
  container.replaceChildren(header(userName), el("p", { class: "muted" }, ["Cargando..."]));
}

export function renderDashboardError(container, { userName }) {
  container.replaceChildren(header(userName), el("p", { class: "muted" }, ["No se pudo cargar el dashboard."]));
}

/**
 * @param {HTMLElement} container
 * @param {{ userName: string, dashboard: object }} data
 * @param {{ onExport: () => void }} handlers
 */
export function renderDashboardView(container, { userName, dashboard }, { onExport }) {
  const s = dashboard.summary;
  container.replaceChildren(
    header(userName),
    el("div", { class: "cards" }, [
      summaryCard("Usuarios totales", s.usersTotal, "users"),
      summaryCard("Usuarios activos", s.usersActive, "check"),
      summaryCard("Administradores", s.usersAdmin, "shield"),
      summaryCard("Endpoints monitoreados", s.monitoredEndpoints, "link"),
      summaryCard("Peticiones (24 h)", s.requestsLast24h, "chart"),
      summaryCard("Latencia promedio", `${s.avgLatencyMs} ms`, "bolt"),
    ]),
    el("div", { class: "grid-2" }, [
      doughnutChart("Códigos de respuesta", dashboard.requestsByStatus.map((x) => ({ label: String(x.status), value: x.count }))),
      doughnutChart("Peticiones por método", dashboard.requestsByMethod.map((x) => ({ label: x.method, value: x.count }))),
    ]),
    el("div", { class: "panel" }, [
      el("div", { class: "row-between" }, [
        el("h3", {}, ["Actividad reciente"]),
        el("button", { class: "btn btn-sm", onclick: onExport }, ["Exportar CSV"]),
      ]),
      recentRequestsTable(dashboard.recentRequests),
    ])
  );
}
