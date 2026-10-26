// Vista de registro (#/register). Solo dibuja el formulario y avisa al controlador.
import { el } from "../utilidades.js";

/**
 * @param {HTMLElement} container
 * @param {{ onSubmit: (data: { name: string, email: string, password: string }) => void }} handlers
 */
export function renderRegisterView(container, { onSubmit }) {
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

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    onSubmit(Object.fromEntries(new FormData(form)));
  });

  container.replaceChildren(el("div", { class: "auth-card" }, [
    el("div", { class: "auth-brand" }, ["AXON STACK FLOW"]),
    el("h1", {}, ["Crear cuenta"]),
    el("p", { class: "muted" }, ["Regístrate para empezar a usar el panel"]),
    form,
    el("p", { class: "muted small" }, ["¿Ya tienes cuenta? ", el("a", { href: "#/login" }, ["Inicia sesión"])]),
  ]));

  return {
    setLoading(loading) {
      submit.disabled = loading;
      submit.textContent = loading ? "Enviando..." : "Registrarse";
    },
  };
}
