// Vista #/verify: código de 6 dígitos para el registro o el inicio de sesión.
import { el } from "../../utils/dom.js";
import { toast } from "../../utils/toast.js";
import { authApi } from "../../api/auth.api.js";
import { session } from "../../store/session.store.js";

export function renderVerifyView(container) {
  const { email, purpose } = session.getPendingVerification();
  const isRegistration = purpose === "registration";

  if (!email) {
    location.hash = "#/login";
    return;
  }

  const submit = el("button", { type: "submit", class: "btn btn-primary" }, ["Verificar"]);
  const form = el("form", {}, [
    el("label", { for: "verify-code" }, ["Código de verificación (6 dígitos)"]),
    el("input", {
      id: "verify-code", name: "code", required: true, maxlength: "6", pattern: "[0-9]{6}",
      inputmode: "numeric", autocomplete: "one-time-code",
    }),
    submit,
  ]);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const code = new FormData(form).get("code");
    submit.disabled = true;
    try {
      if (isRegistration) {
        await authApi.verifyRegistration(email, code);
        session.clearPendingVerification();
        toast.success("Correo verificado. Ya puedes iniciar sesión.");
        location.hash = "#/login";
      } else {
        const result = await authApi.verifyLogin(email, code);
        session.save(result);
        session.clearPendingVerification();
        toast.success(`Bienvenido, ${result.user.name}`);
        location.hash = "#/dashboard";
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      submit.disabled = false;
    }
  });

  const resend = async () => {
    try {
      await (isRegistration ? authApi.resendRegistrationCode(email) : authApi.resendLoginCode(email));
      toast.success("Código reenviado");
    } catch (error) {
      toast.error(error.message);
    }
  };

  container.replaceChildren(el("div", { class: "auth-card" }, [
    el("h1", {}, ["Verificación"]),
    el("p", { class: "muted" }, [isRegistration
      ? "Te enviamos un código para confirmar tu correo."
      : "Ingresa el código de 6 dígitos que enviamos a tu correo."]),
    el("p", { class: "muted small" }, [`Correo: ${email}`]),
    form,
    el("div", { class: "row small" }, [
      el("button", { type: "button", class: "btn btn-link", onclick: resend }, ["Reenviar código"]),
      el("a", { href: "#/login", class: "btn btn-link" }, ["Volver"]),
    ]),
  ]));
}
