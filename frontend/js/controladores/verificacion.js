// Controlador de #/verify: comprueba el código del registro o del inicio de sesión (paso 2).
import { renderVerifyView } from "../vistas/verificacion.js";
import { http } from "../modelos/api.js";
import { resendRegistrationCode } from "./inicio-sesion.js";
import { VerifyCodeRequestDto, ResendCodeRequestDto } from "../dto/autenticacion.js";
import { session, VERIFICATION_PURPOSE } from "../modelos/sesion.js";
import { toast } from "../utilidades.js";

// ---------- Endpoints ----------
// POST /auth/register/verify      (público)
// POST /auth/login/verify         (público) paso 2; devuelve la sesión
// POST /auth/login/resend-code    (público)
// (POST /auth/register/resend-code está en inicio-sesion.js)
const verifyRegistration = (dto) => http.post("/auth/register/verify", dto);
const verifyLogin = (dto) => http.post("/auth/login/verify", dto);
const resendLoginCode = (dto) => http.post("/auth/login/resend-code", dto);

export function showVerify(container) {
  const { email, purpose } = session.getPendingVerification();
  if (!email) {
    location.hash = "#/login";
    return;
  }
  const isRegistration = purpose === VERIFICATION_PURPOSE.REGISTRATION;

  async function verify(code) {
    if (isRegistration) {
      await verifyRegistration(new VerifyCodeRequestDto({ email, code }));
      session.clearPendingVerification();
      toast.success("Correo verificado. Ya puedes iniciar sesión.");
      location.hash = "#/login";
      return;
    }
    const result = await verifyLogin(new VerifyCodeRequestDto({ email, code }));
    session.save(result);
    session.clearPendingVerification();
    toast.success(`Bienvenido, ${result.user.name}`);
    location.hash = session.isAdmin() ? "#/dashboard" : "#/monitoring";
  }

  const view = renderVerifyView(container, { email, isRegistration, expiresAt: session.getCodeExpiry() }, {
    async onSubmit(code) {
      view.setLoading(true);
      try {
        await verify(code);
      } catch (error) {
        toast.error(error.message);
        view.clearCode();
      } finally {
        view.setLoading(false);
      }
    },
    async onResend() {
      try {
        await (isRegistration ? resendRegistrationCode(new ResendCodeRequestDto({ email })) : resendLoginCode(new ResendCodeRequestDto({ email })));
        toast.success("Si el correo existe, te enviamos un código nuevo");
        session.restartCodeExpiry();
        view.restartTimers(session.getCodeExpiry());
      } catch (error) {
        toast.error(error.message);
      }
    },
  });

  return view.destroy; // detiene los contadores al salir
}
