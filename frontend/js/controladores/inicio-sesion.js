// Controlador de #/login: valida credenciales (paso 1) y lleva a la verificación del código.
import { renderLoginView } from "../vistas/inicio-sesion.js";
import { authApi } from "../modelos/api.js";
import { session } from "../modelos/sesion.js";
import { toast } from "../utilidades.js";

export function showLogin(container) {
  const view = renderLoginView(container, {
    async onSubmit({ email, password }) {
      view.setLoading(true);
      try {
        const result = await authApi.login(email, password);
        session.setPendingVerification(result.email, "login");
        toast.info("Te enviamos un código a tu correo");
        location.hash = "#/verify";
      } catch (error) {
        toast.error(error.message);
      } finally {
        view.setLoading(false);
      }
    },
  });
}
