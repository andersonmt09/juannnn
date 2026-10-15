// Vista #/dashboard
import { el, formatDate } from "../../utils/dom.js";
import { icon } from "../../utils/icons.js";
import { toast } from "../../utils/toast.js";
import { exportToCsv } from "../../utils/csv.js";
import { metricApi } from "../../api/metric.api.js";
import { session } from "../../store/session.store.js";
import { pageHeader } from "../../components/page-header.component.js";
import { doughnutChart } from "../../components/doughnut-chart.component.js";
import { emptyState } from "../../components/empty-state.component.js";

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

export async function renderDashboardView(container) {
  container.replaceChildren(
    pageHeader("Dashboard", `Resumen del sistema - ${session.getUser()?.name || ""}`),
    el("p", { class: "muted" }, ["Cargando..."])
  );

  try {
    const data = await metricApi.getDashboard();
    const s = data.summary;

    const exportButton = el("button", {
      class: "btn btn-sm",
      onclick: () => exportToCsv(data.recentRequests, "axon-actividad.csv", [
        ["id", "id"], ["method", "metodo"], ["path", "ruta"], ["statusCode", "estado"],
        ["latencyMs", "latencia_ms"], ["createdAt", "fecha"],
      ]),
    }, ["Exportar CSV"]);

    container.replaceChildren(
      pageHeader("Dashboard", `Resumen del sistema - ${session.getUser()?.name || ""}`),
      el("div", { class: "cards" }, [
        summaryCard("Usuarios totales", s.usersTotal, "users"),
        summaryCard("Usuarios activos", s.usersActive, "check"),
        summaryCard("Administradores", s.usersAdmin, "shield"),
        summaryCard("Endpoints registrados", s.endpoints, "link"),
        summaryCard("Peticiones (24 h)", s.requestsLast24h, "chart"),
        summaryCard("Latencia promedio", `${s.avgLatencyMs} ms`, "bolt"),
      ]),
      el("div", { class: "grid-2" }, [
        doughnutChart("Códigos de respuesta", data.requestsByStatus.map((x) => ({ label: String(x.status), value: x.count }))),
        doughnutChart("Peticiones por método", data.requestsByMethod.map((x) => ({ label: x.method, value: x.count }))),
      ]),
      el("div", { class: "panel" }, [
        el("div", { class: "row-between" }, [el("h3", {}, ["Actividad reciente"]), exportButton]),
        recentRequestsTable(data.recentRequests),
      ])
    );
  } catch (error) {
    container.replaceChildren(pageHeader("Dashboard"), el("p", { class: "muted" }, ["No se pudo cargar el dashboard."]));
    toast.error(error.message);
  }
}
