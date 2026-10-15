/**
 * VISTA: Registro de usuario (RF-01)   ruta: #/register
 */
import { el } from "../../utils/dom.js";
import { toast } from "../../utils/toast.js";
import { authService } from "../../services/auth.service.js";
import { session } from "../../services/session.service.js";

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
      const result = await authService.register(Object.fromEntries(new FormData(form)));
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
