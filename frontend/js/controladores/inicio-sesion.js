// Controlador de #/login: valida credenciales (paso 1) y lleva a la verificación del código.
import { renderLoginView } from "../vistas/inicio-sesion.js";
import { authApi, systemApi } from "../modelos/api.js";
import { session, VERIFICATION_PURPOSE } from "../modelos/sesion.js";
import { toast } from "../utilidades.js";

export function showLogin(container) {
  const view = renderLoginView(container, {
    async onSubmit({ email, password }) {
      view.setLoading(true);
      try {
        const result = await authApi.login(email, password);
        session.setPendingVerification(result.email || email, VERIFICATION_PURPOSE.LOGIN);
        toast.info("Te enviamos un código a tu correo");
        location.hash = "#/verify";
      } catch (error) {
        if (error.data?.code === "EMAIL_NOT_VERIFIED") await goVerifyEmail(email);
        else toast.error(error.message);
      } finally {
        view.setLoading(false);
      }
    },
  });

  // Correo sin verificar: pide un código de registro nuevo y sigue en #/verify.
  async function goVerifyEmail(email) {
    session.setPendingVerification(email, VERIFICATION_PURPOSE.REGISTRATION);
    try {
      await authApi.resendRegistrationCode(email);
      toast.info("Tu correo aún no está verificado. Te enviamos un código.");
    } catch (error) {
      toast.error(error.message);
    }
    location.hash = "#/verify";
  }

  // Píldora de estado de la API (no bloquea el formulario si falla).
  systemApi.getHealth()
    .then((health) => view.setHealth(health?.status))
    .catch(() => view.setHealth("offline"));
}
