// Vista #/login
import { el } from "../../utils/dom.js";
import { toast } from "../../utils/toast.js";
import { authApi } from "../../api/auth.api.js";
import { session } from "../../store/session.store.js";

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
