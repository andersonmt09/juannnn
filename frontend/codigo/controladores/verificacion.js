// Controlador de #/verify: comprueba el código del registro o del inicio de sesión (paso 2).
import { renderVerifyView } from "../vistas/verificacion.js";
import { authService } from "../servicios/autenticacion.js";
import { session } from "../modelos/sesion.js";
import { toast } from "../utilidades/notificaciones.js";

export function showVerify(container) {
  const { email, purpose } = session.getPendingVerification();
  if (!email) {
    location.hash = "#/login";
    return;
  }
  const isRegistration = purpose === "registration";

  async function verify(code) {
    if (isRegistration) {
      await authService.verifyRegistration(email, code);
      session.clearPendingVerification();
      toast.success("Correo verificado. Ya puedes iniciar sesión.");
      location.hash = "#/login";
      return;
    }
    const result = await authService.verifyLogin(email, code);
    session.save(result);
    session.clearPendingVerification();
    toast.success(`Bienvenido, ${result.user.name}`);
    location.hash = "#/dashboard";
  }

  const view = renderVerifyView(container, { email, isRegistration }, {
    async onSubmit(code) {
      view.setLoading(true);
      try {
        await verify(code);
      } catch (error) {
        toast.error(error.message);
      } finally {
        view.setLoading(false);
      }
    },
    async onResend() {
      try {
        await (isRegistration ? authService.resendRegistrationCode(email) : authService.resendLoginCode(email));
        toast.success("Código reenviado");
      } catch (error) {
        toast.error(error.message);
      }
    },
  });
}
