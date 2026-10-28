// Controlador de #/login: valida credenciales (paso 1) y lleva a la verificación del código.
// Secuencia del tablero (login):
//   Usuario -> Vista (onSubmit) -> login -> POST /auth/login
//   -> CredentialsRequestDto -> ControlUsu.login -> validateCredentials -> User (Modelo) -> BD.
//   Correcto: código al correo -> #/verify -> panel. Error (NO): toast + enlace "¿Olvidaste tu contraseña?".
import { renderLoginView } from "../vistas/inicio-sesion.js";
import { http } from "../modelos/api.js";
import { getHealth } from "./panel.js";
import { CredentialsRequestDto, ResendCodeRequestDto } from "../dto/autenticacion.js";
import { session, VERIFICATION_PURPOSE } from "../modelos/sesion.js";
import { toast } from "../utilidades.js";

// ---------- Endpoints ----------
// POST /auth/login                (público) paso 1
// POST /auth/register/resend-code (público) correo sin verificar
export const login = (dto) => http.post("/auth/login", dto);
export const resendRegistrationCode = (dto) => http.post("/auth/register/resend-code", dto);

export function showLogin(container) {
  const view = renderLoginView(container, {
    async onSubmit({ email, password }) {
      view.setLoading(true);
      try {
        const result = await login(new CredentialsRequestDto({ email, password }));
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
      await resendRegistrationCode(new ResendCodeRequestDto({ email }));
      toast.info("Tu correo aún no está verificado. Te enviamos un código.");
    } catch (error) {
      toast.error(error.message);
    }
    location.hash = "#/verify";
  }

  // Píldora de estado de la API (no bloquea el formulario si falla).
  getHealth()
    .then((health) => view.setHealth(health?.status))
    .catch(() => view.setHealth("offline"));
}
