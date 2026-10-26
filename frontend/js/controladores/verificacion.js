// Controlador de #/verify: comprueba el código del registro o del inicio de sesión (paso 2).
import { renderVerifyView } from "../vistas/verificacion.js";
import { authApi } from "../modelos/api.js";
import { session } from "../modelos/sesion.js";
import { toast } from "../utilidades.js";

export function showVerify(container) {
  const { email, purpose } = session.getPendingVerification();
  if (!email) {
    location.hash = "#/login";
    return;
  }
  const isRegistration = purpose === "registration";

  async function verify(code) {
    if (isRegistration) {
      await authApi.verifyRegistration(email, code);
      session.clearPendingVerification();
      toast.success("Correo verificado. Ya puedes iniciar sesión.");
      location.hash = "#/login";
      return;
    }
    const result = await authApi.verifyLogin(email, code);
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
        await (isRegistration ? authApi.resendRegistrationCode(email) : authApi.resendLoginCode(email));
        toast.success("Código reenviado");
      } catch (error) {
        toast.error(error.message);
      }
    },
  });
}
