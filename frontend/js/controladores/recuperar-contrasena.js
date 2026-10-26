// Controlador de #/forgot-password: pide el código (siempre con respuesta genérica),
// valida la confirmación y restablece la contraseña; al terminar vuelve a #/login.
import { renderForgotPasswordView } from "../vistas/recuperar-contrasena.js";
import { authApi, systemApi } from "../modelos/api.js";
import { toast } from "../utilidades.js";

export function showForgotPassword(container) {
  let email = "";

  async function requestCode(address) {
    const result = await authApi.forgotPassword(address);
    toast.info(result?.message || "Si el correo está registrado, te enviamos un código");
  }

  const view = renderForgotPasswordView(container, {
    async onRequestCode(address) {
      view.setLoading(true);
      try {
        await requestCode(address);
        email = address;
        view.showCodeStep(email);
      } catch (error) {
        toast.error(error.message);
      } finally {
        view.setLoading(false);
      }
    },
    async onReset({ code, password, confirmPassword }) {
      if (password !== confirmPassword) {
        toast.error("Las contraseñas no coinciden");
        return;
      }
      view.setLoading(true);
      try {
        await authApi.resetPassword(email, code, password);
        toast.success("Contraseña actualizada. Ya puedes iniciar sesión.");
        location.hash = "#/login";
      } catch (error) {
        toast.error(error.message);
        view.clearCode();
      } finally {
        view.setLoading(false);
      }
    },
    async onResend() {
      try {
        await requestCode(email);
        view.restartCooldown();
      } catch (error) {
        toast.error(error.message);
      }
    },
  });

  // Píldora de estado de la API (no bloquea el formulario si falla).
  systemApi.getHealth()
    .then((health) => view.setHealth(health?.status))
    .catch(() => view.setHealth("offline"));

  return view.destroy; // detiene la espera de reenvío al salir
}
