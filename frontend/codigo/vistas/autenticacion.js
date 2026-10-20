// Vistas de autenticación: #/login, #/register y #/verify (código de 6 dígitos).
import { el } from "../utilidades/dom.js";
import { toast } from "../utilidades/notificaciones.js";
import { authApi } from "../servicios-api/autenticacion.js";
import { session } from "../estado/sesion.js";

export function renderLoginView(container) {
  const submit = el("button", { type: "submit", class: "btn btn-primary" }, ["Ingresar"]);
  const form = el("form", {}, [
    el("label", { for: "login-email" }, ["Correo electrónico"]),
    el("input", { id: "login-email", type: "email", name: "email", required: true, autocomplete: "email" }),
    el("label", { for: "login-password" }, ["Contraseña"]),
    el("input", { id: "login-password", type: "password", name: "password", required: true, autocomplete: "current-password" }),
    submit,
  ]);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const { email, password } = Object.fromEntries(new FormData(form));
    submit.disabled = true;
    submit.textContent = "Verificando...";
    try {
      const result = await authApi.login(email, password);
      session.setPendingVerification(result.email, "login");
      toast.info("Te enviamos un código a tu correo");
      location.hash = "#/verify";
    } catch (error) {
      toast.error(error.message);
    } finally {
      submit.disabled = false;
      submit.textContent = "Ingresar";
    }
  });

  container.replaceChildren(el("div", { class: "auth-card" }, [
    el("div", { class: "auth-brand" }, ["AXON STACK FLOW"]),
    el("h1", {}, ["Bienvenido de nuevo"]),
    el("p", { class: "muted" }, ["Inicia sesión para acceder al panel"]),
    form,
    el("p", { class: "muted small" }, ["¿No tienes cuenta? ", el("a", { href: "#/register" }, ["Regístrate"])]),
  ]));
}

export function renderRegisterView(container) {
  const submit = el("button", { type: "submit", class: "btn btn-primary" }, ["Registrarse"]);
  const form = el("form", {}, [
    el("label", { for: "reg-name" }, ["Nombre completo"]),
    el("input", { id: "reg-name", name: "name", required: true, minlength: "2", autocomplete: "name" }),
    el("label", { for: "reg-email" }, ["Correo electrónico"]),
    el("input", { id: "reg-email", type: "email", name: "email", required: true, autocomplete: "email" }),
    el("label", { for: "reg-password" }, ["Contraseña (mínimo 6 caracteres)"]),
    el("input", { id: "reg-password", type: "password", name: "password", required: true, minlength: "6", autocomplete: "new-password" }),
    submit,
  ]);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    submit.disabled = true;
    submit.textContent = "Enviando...";
    try {
      const result = await authApi.register(Object.fromEntries(new FormData(form)));
      session.setPendingVerification(result.email, "registration");
      toast.success("Código de verificación enviado a tu correo");
      location.hash = "#/verify";
    } catch (error) {
      toast.error(error.message);
    } finally {
      submit.disabled = false;
      submit.textContent = "Registrarse";
    }
  });

  container.replaceChildren(el("div", { class: "auth-card" }, [
    el("div", { class: "auth-brand" }, ["AXON STACK FLOW"]),
    el("h1", {}, ["Crear cuenta"]),
    el("p", { class: "muted" }, ["Regístrate para empezar a usar el panel"]),
    form,
    el("p", { class: "muted small" }, ["¿Ya tienes cuenta? ", el("a", { href: "#/login" }, ["Inicia sesión"])]),
  ]));
}

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
