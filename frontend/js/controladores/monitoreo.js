// Controlador de #/monitoring: muestra las estadísticas y, si es administrador, agrega o quita endpoints.
import { renderMonitoringView } from "../vistas/monitoreo.js";
import { monitoringApi } from "../modelos/api.js";
import { session } from "../modelos/sesion.js";
import { toast } from "../utilidades.js";

export async function showMonitoring(container) {
  let endpoints = [];

  async function loadEndpoints() {
    try {
      endpoints = await monitoringApi.listEndpoints();
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
        const available = (await monitoringApi.listApiRoutes()).filter((r) => !monitored.has(`${r.method} ${r.path}`));
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
        await monitoringApi.addEndpoint(data);
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
        await monitoringApi.removeEndpoint(endpoint.id);
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
