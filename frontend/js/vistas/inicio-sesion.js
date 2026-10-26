// Vista de inicio de sesión (#/login). Solo dibuja el formulario y avisa al controlador.
import { el } from "../utilidades.js";

/**
 * @param {HTMLElement} container
 * @param {{ onSubmit: (data: { email: string, password: string }) => void }} handlers
 */
export function renderLoginView(container, { onSubmit }) {
  const submit = el("button", { type: "submit", class: "btn btn-primary" }, ["Ingresar"]);
  const form = el("form", {}, [
    el("label", { for: "login-email" }, ["Correo electrónico"]),
    el("input", { id: "login-email", type: "email", name: "email", required: true, autocomplete: "email" }),
    el("label", { for: "login-password" }, ["Contraseña"]),
    el("input", { id: "login-password", type: "password", name: "password", required: true, autocomplete: "current-password" }),
    submit,
  ]);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    onSubmit(Object.fromEntries(new FormData(form)));
  });

  container.replaceChildren(el("div", { class: "auth-card" }, [
    el("div", { class: "auth-brand" }, ["AXON STACK FLOW"]),
    el("h1", {}, ["Bienvenido de nuevo"]),
    el("p", { class: "muted" }, ["Inicia sesión para acceder al panel"]),
    form,
    el("p", { class: "muted small" }, ["¿No tienes cuenta? ", el("a", { href: "#/register" }, ["Regístrate"])]),
  ]));

  return {
    setLoading(loading) {
      submit.disabled = loading;
      submit.textContent = loading ? "Verificando..." : "Ingresar";
    },
  };
}
