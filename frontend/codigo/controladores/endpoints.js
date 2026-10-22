// Controlador de #/endpoints: consulta el catálogo y, si es administrador, crea y elimina endpoints.
import { renderEndpointsView } from "../vistas/endpoints.js";
import { endpointService } from "../servicios/endpoints.js";
import { session } from "../modelos/sesion.js";
import { toast } from "../utilidades/notificaciones.js";

export async function showEndpoints(container) {
  async function loadEndpoints() {
    try {
      view.showEndpoints(await endpointService.list());
    } catch (error) {
      view.showError();
      toast.error(error.message);
    }
  }

  const view = renderEndpointsView(container, { canManage: session.isAdmin() }, {
    async onSave(data) {
      try {
        await endpointService.create(data);
        toast.success("Endpoint creado");
        view.resetForm();
        await loadEndpoints();
      } catch (error) {
        toast.error(error.message);
      }
    },
    async onDelete(endpoint) {
      if (!confirm(`¿Eliminar el endpoint "${endpoint.name}"?`)) return;
      try {
        await endpointService.remove(endpoint.id);
        toast.success("Endpoint eliminado");
        await loadEndpoints();
      } catch (error) {
        toast.error(error.message);
      }
    },
  });

  await loadEndpoints();
}
