// Vista de inicio de sesión (#/login). Solo dibuja y avisa al controlador.
import { el, icon } from "../utilidades.js";
import { architectureGraph, passwordField, statusDot } from "./componentes.js";

const HEALTH_LABELS = { online: "API en línea", degraded: "API degradada", offline: "API sin conexión", checking: "Comprobando API…" };

/**
 * Armazón de dos columnas compartido por login y registro.
 * Devuelve { layout, setHealth } para que el controlador pinte el estado de la API.
 */
export function buildAuthShell(card) {
  const pillText = el("span", { class: "status-text" }, [HEALTH_LABELS.checking]);
  const pill = el("div", { class: "status-pill", role: "status", "aria-live": "polite", "data-status": "checking" }, [
    statusDot("offline"), pillText,
  ]);
  const aside = el("aside", { class: "auth-aside", "aria-label": "Presentación de AXON Stack Flow" }, [
    el("div", { class: "brand" }, [
      el("span", { class: "brand-mark" }, [icon("layers")]),
      el("div", { class: "brand-text" }, [el("span", { class: "brand-name" }, ["AXON"]), el("span", { class: "brand-sub" }, ["Stack Flow"])]),
    ]),
    el("div", {}, [
      el("h2", { class: "auth-hero" }, ["AXON Stack Flow"]),
      el("p", { class: "auth-tagline" }, ["Observa, gestiona y verifica tu API en tiempo real"]),
    ]),
    architectureGraph().element,
    el("div", {}, [pill]),
  ]);
  const layout = el("div", { class: "auth-layout" }, [aside, el("main", { class: "auth-main" }, [card])]);

  return {
    layout,
    setHealth(status) {
      const key = HEALTH_LABELS[status] ? status : "offline";
      pill.dataset.status = key;
      pillText.textContent = HEALTH_LABELS[key];
      pill.firstChild.dataset.status = key;
    },
  };
}

/**
 * @param {HTMLElement} container
 * @param {{ onSubmit: (data: { email: string, password: string }) => void }} handlers
 */
export function renderLoginView(container, { onSubmit }) {
  const submit = el("button", { type: "submit", class: "btn btn-primary btn-block" }, [el("span", {}, ["Iniciar sesión"])]);
  const emailInput = el("input", { id: "login-email", name: "email", type: "email", class: "input", required: true, autocomplete: "email", placeholder: "tu@correo.com" });
  const password = passwordField({ id: "login-password", name: "password", label: "Contraseña", autocomplete: "current-password" });
  const form = el("form", { novalidate: false }, [
    el("div", { class: "field" }, [el("label", { class: "field-label", for: "login-email" }, ["Correo electrónico"]), emailInput]),
    password,
    submit,
  ]);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    onSubmit(Object.fromEntries(new FormData(form)));
  });

  const card = el("section", { class: "auth-card", "aria-labelledby": "login-title" }, [
    el("h1", { id: "login-title" }, ["Inicia sesión"]),
    el("p", { class: "auth-sub" }, ["Te enviaremos un código a tu correo"]),
    form,
    el("p", { class: "auth-foot" }, ["¿No tienes cuenta? ", el("a", { href: "#/register" }, ["Crear cuenta"])]),
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
