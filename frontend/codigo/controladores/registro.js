// Controlador de #/register: crea la cuenta y lleva a la verificación del correo.
import { renderRegisterView } from "../vistas/registro.js";
import { authService } from "../servicios/autenticacion.js";
import { session } from "../modelos/sesion.js";
import { toast } from "../utilidades/notificaciones.js";

export function showRegister(container) {
  const view = renderRegisterView(container, {
    async onSubmit(data) {
      view.setLoading(true);
      try {
        const result = await authService.register(data);
        session.setPendingVerification(result.email, "registration");
        toast.success("Código de verificación enviado a tu correo");
        location.hash = "#/verify";
      } catch (error) {
        toast.error(error.message);
      } finally {
        view.setLoading(false);
      }
    },
  });
}
