// Controlador de #/monitoring: muestra las estadísticas y, si es administrador, agrega o quita endpoints.
import { renderMonitoringView } from "../vistas/monitoreo.js";
import { confirmDialog } from "../vistas/componentes.js";
import { monitoringApi } from "../modelos/api.js";
import { session } from "../modelos/sesion.js";
import { toast } from "../utilidades.js";

export async function showMonitoring(container) {
  let endpoints = [];
  let active = true;

  async function loadEndpoints() {
    try {
      const list = await monitoringApi.listEndpoints();
      if (!active) return;
      endpoints = list;
      view.showEndpoints(endpoints);
    } catch (error) {
      if (!active) return;
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
      view.setSaving(true);
      try {
        await monitoringApi.addEndpoint(data);
        toast.success("Endpoint agregado al monitoreo");
        view.closeForm();
        await loadEndpoints();
      } catch (error) {
        toast.error(error.message);
      } finally {
        view.setSaving(false);
      }
    },
    async onDelete(endpoint) {
      const confirmed = await confirmDialog({
        title: "Quitar del monitoreo",
        message: `¿Quitar "${endpoint.name}" del monitoreo? Se dejará de vigilar ${endpoint.method} ${endpoint.path}.`,
        confirmLabel: "Quitar",
      });
      if (!confirmed) return;
      try {
        await monitoringApi.removeEndpoint(endpoint.id);
        toast.success("Endpoint quitado del monitoreo");
        await loadEndpoints();
      } catch (error) {
        toast.error(error.message);
      }
    },
    onRefresh() {
      view.showLoading();
      loadEndpoints();
    },
  });

  await loadEndpoints();
  return () => { active = false; };
}
