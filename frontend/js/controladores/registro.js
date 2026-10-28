// Controlador de #/register: valida la confirmación, crea la cuenta y lleva a la verificación.
import { renderRegisterView } from "../vistas/registro.js";
import { http } from "../modelos/api.js";
import { RegisterRequestDto } from "../vistas/dto.js";
import { session, VERIFICATION_PURPOSE } from "../modelos/sesion.js";
import { toast } from "../utilidades.js";

// ---------- Endpoints ----------
// POST /auth/register (público)
export const register = (dto) => http.post("/auth/register", dto);

export function showRegister(container) {
  const view = renderRegisterView(container, {
    async onSubmit({ confirmPassword, ...data }) {
      if (data.password !== confirmPassword) {
        toast.error("Las contraseñas no coinciden");
        return;
      }
      view.setLoading(true);
      try {
        const result = await register(new RegisterRequestDto(data));
        session.setPendingVerification(result.email || data.email, VERIFICATION_PURPOSE.REGISTRATION);
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
