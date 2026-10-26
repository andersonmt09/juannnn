// Controlador de #/monitoring: muestra las estadísticas y, si es administrador, agrega o quita endpoints.
import { renderMonitoringView } from "../vistas/monitoreo.js";
import { monitoringService } from "../servicios/monitoreo.js";
import { session } from "../modelos/sesion.js";
import { toast } from "../utilidades/notificaciones.js";

export async function showMonitoring(container) {
  let endpoints = [];

  async function loadEndpoints() {
    try {
      endpoints = await monitoringService.listEndpoints();
      view.showEndpoints(endpoints);
    } catch (error) {
      view.showError();
      toast.error(error.message);
    }
  }

  const view = renderMonitoringView(container, { canManage: session.isAdmin() }, {
    async onOpenForm() {
      try {
        const monitored = new Set(endpoints.map((e) => `${e.method} ${e.path}`));
        const available = (await monitoringService.listApiRoutes()).filter((r) => !monitored.has(`${r.method} ${r.path}`));
        if (!available.length) {
          toast.info("Todas las rutas de la API ya se están monitoreando");
          return;
        }
        view.openForm(available);
      } catch (error) {
        toast.error(error.message);
      }
    },
    async onSave(data) {
      try {
        await monitoringService.addEndpoint(data);
        toast.success("Endpoint agregado al monitoreo");
        view.closeForm();
        await loadEndpoints();
      } catch (error) {
        toast.error(error.message);
      }
    },
    async onDelete(endpoint) {
      if (!confirm(`¿Quitar "${endpoint.name}" del monitoreo?`)) return;
      try {
        await monitoringService.removeEndpoint(endpoint.id);
        toast.success("Endpoint quitado del monitoreo");
        await loadEndpoints();
      } catch (error) {
        toast.error(error.message);
      }
    },
    onRefresh: loadEndpoints,
  });

  await loadEndpoints();
}
