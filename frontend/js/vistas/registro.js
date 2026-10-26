// Vista de registro (#/register). Solo dibuja y avisa al controlador.
import { el } from "../utilidades.js";
import { passwordField } from "./componentes.js";
import { buildAuthShell } from "./inicio-sesion.js";

/**
 * @param {HTMLElement} container
 * @param {{ onSubmit: (data: { name: string, email: string, password: string, confirmPassword: string }) => void }} handlers
 */
export function renderRegisterView(container, { onSubmit }) {
  const submit = el("button", { type: "submit", class: "btn btn-primary btn-block" }, [el("span", {}, ["Crear cuenta"])]);
  const form = el("form", {}, [
    el("div", { class: "field" }, [
      el("label", { class: "field-label", for: "reg-name" }, ["Nombre completo"]),
      el("input", { id: "reg-name", name: "name", class: "input", required: true, minlength: "2", autocomplete: "name", placeholder: "Tu nombre" }),
    ]),
    el("div", { class: "field" }, [
      el("label", { class: "field-label", for: "reg-email" }, ["Correo electrónico"]),
      el("input", { id: "reg-email", name: "email", type: "email", class: "input", required: true, autocomplete: "email", placeholder: "tu@correo.com" }),
    ]),
    passwordField({ id: "reg-password", name: "password", label: "Contraseña", autocomplete: "new-password", hint: "Mínimo 6 caracteres", minlength: 6 }),
    passwordField({ id: "reg-confirm", name: "confirmPassword", label: "Confirmar contraseña", autocomplete: "new-password" }),
    submit,
  ]);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    onSubmit(Object.fromEntries(new FormData(form)));
  });

  const card = el("section", { class: "auth-card", "aria-labelledby": "reg-title" }, [
    el("h1", { id: "reg-title" }, ["Crear cuenta"]),
    el("p", { class: "auth-sub" }, ["Regístrate para empezar a usar el panel"]),
    form,
    el("p", { class: "auth-foot" }, ["¿Ya tienes cuenta? ", el("a", { href: "#/login" }, ["Inicia sesión"])]),
  ]);
  const shell = buildAuthShell(card);
  container.replaceChildren(shell.layout);

  return {
    setHealth: shell.setHealth,
    setLoading(loading) {
      submit.disabled = loading;
      submit.classList.toggle("is-loading", loading);
      submit.setAttribute("aria-busy", String(loading));
    },
  };
}
