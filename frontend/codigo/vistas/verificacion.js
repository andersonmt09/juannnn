// Vista de verificación con código de 6 dígitos (#/verify), para el registro y el inicio de sesión.
import { el } from "../utilidades/dom.js";

/**
 * @param {HTMLElement} container
 * @param {{ email: string, isRegistration: boolean }} data
 * @param {{ onSubmit: (code: string) => void, onResend: () => void }} handlers
 */
export function renderVerifyView(container, { email, isRegistration }, { onSubmit, onResend }) {
  const submit = el("button", { type: "submit", class: "btn btn-primary" }, ["Verificar"]);
  const form = el("form", {}, [
    el("label", { for: "verify-code" }, ["Código de verificación (6 dígitos)"]),
    el("input", {
      id: "verify-code", name: "code", required: true, maxlength: "6", pattern: "[0-9]{6}",
      inputmode: "numeric", autocomplete: "one-time-code",
    }),
    submit,
  ]);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    onSubmit(new FormData(form).get("code"));
  });

  container.replaceChildren(el("div", { class: "auth-card" }, [
    el("h1", {}, ["Verificación"]),
    el("p", { class: "muted" }, [isRegistration
      ? "Te enviamos un código para confirmar tu correo."
      : "Ingresa el código de 6 dígitos que enviamos a tu correo."]),
    el("p", { class: "muted small" }, [`Correo: ${email}`]),
    form,
    el("div", { class: "row small" }, [
      el("button", { type: "button", class: "btn btn-link", onclick: onResend }, ["Reenviar código"]),
      el("a", { href: "#/login", class: "btn btn-link" }, ["Volver"]),
    ]),
  ]));

  return {
    setLoading(loading) {
      submit.disabled = loading;
      submit.textContent = loading ? "Verificando..." : "Verificar";
    },
  };
}
