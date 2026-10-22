// Controlador de #/dashboard: pide las métricas y las entrega a la vista.
import { renderDashboardView, renderDashboardLoading, renderDashboardError } from "../vistas/panel.js";
import { metricService } from "../servicios/metricas.js";
import { session } from "../modelos/sesion.js";
import { toast } from "../utilidades/notificaciones.js";
import { exportToCsv } from "../utilidades/csv.js";

const CSV_COLUMNS = [
  ["id", "id"], ["method", "metodo"], ["path", "ruta"], ["statusCode", "estado"],
  ["latencyMs", "latencia_ms"], ["createdAt", "fecha"],
];

export async function showDashboard(container) {
  const userName = session.getUser()?.name;
  renderDashboardLoading(container, { userName });

  try {
    const dashboard = await metricService.getDashboard();
    renderDashboardView(container, { userName, dashboard }, {
      onExport: () => exportToCsv(dashboard.recentRequests, "axon-actividad.csv", CSV_COLUMNS),
    });
  } catch (error) {
    renderDashboardError(container, { userName });
    toast.error(error.message);
  }
}
