// Vista de recuperación de contraseña (#/forgot-password), en dos pasos:
// 1) correo  2) código de 6 dígitos + contraseña nueva + confirmación. Solo dibuja y avisa al controlador.
import { el, maskEmail } from "../utilidades.js";
import { passwordField } from "./componentes.js";
import { buildAuthShell } from "./inicio-sesion.js";

const RESEND_SECONDS = 30; // espera entre reenvíos

/**
 * @param {HTMLElement} container
 * @param {{
 *   onRequestCode: (email: string) => void,
 *   onReset: (data: { code: string, password: string, confirmPassword: string }) => void,
 *   onResend: () => void
 * }} handlers
 */
export function renderForgotPasswordView(container, { onRequestCode, onReset, onResend }) {
  let loading = false;
  let resendTimer = null;

  // ----- Paso 1: correo -----
  const emailInput = el("input", { id: "forgot-email", name: "email", type: "email", class: "input", required: true, autocomplete: "email", placeholder: "tu@correo.com" });
  const requestBtn = el("button", { type: "submit", class: "btn btn-primary btn-block" }, [el("span", {}, ["Enviar código"])]);
  const emailForm = el("form", { class: "auth-step" }, [
    el("div", { class: "field" }, [el("label", { class: "field-label", for: "forgot-email" }, ["Correo electrónico"]), emailInput]),
    requestBtn,
  ]);
  emailForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!loading) onRequestCode(emailInput.value.trim());
  });

  // ----- Paso 2: código + contraseña nueva -----
  const codeInput = el("input", {
    id: "reset-code", name: "code", class: "otp-input", required: true, maxlength: "6", pattern: "[0-9]{6}",
    inputmode: "numeric", autocomplete: "one-time-code", placeholder: "······", "aria-label": "Código de 6 dígitos",
  });
  codeInput.addEventListener("input", () => { codeInput.value = codeInput.value.replace(/\D/g, "").slice(0, 6); });
  const password = passwordField({ id: "reset-password", name: "password", label: "Contraseña nueva", autocomplete: "new-password", hint: "Entre 8 y 72 caracteres", minlength: 8 });
  password.input.maxLength = 72;
  const confirm = passwordField({ id: "reset-confirm", name: "confirmPassword", label: "Confirmar contraseña", autocomplete: "new-password", minlength: 8 });
  confirm.input.maxLength = 72;
  const resetBtn = el("button", { type: "submit", class: "btn btn-primary btn-block" }, [el("span", {}, ["Cambiar contraseña"])]);
  const resend = el("button", { type: "button", class: "btn btn-ghost btn-sm" }, ["Reenviar código"]);
  const sentTo = el("strong", {});
  const resetForm = el("form", { class: "auth-step", hidden: true }, [
    el("div", { class: "field" }, [el("label", { class: "field-label", for: "reset-code" }, ["Código de verificación"]), codeInput]),
    password,
    confirm,
    resetBtn,
    el("div", { class: "row", style: "justify-content:center" }, [resend]),
  ]);
  resetForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (loading) return;
    if (!/^\d{6}$/.test(codeInput.value)) { codeInput.reportValidity(); return; }
    onReset({ code: codeInput.value, password: password.input.value, confirmPassword: confirm.input.value });
  });
  resend.addEventListener("click", () => onResend());

  const sub = el("p", { class: "auth-sub" }, ["Te enviaremos un código para crear una contraseña nueva"]);
  const title = el("h1", { id: "forgot-title" }, ["Recupera tu contraseña"]);
  const card = el("section", { class: "auth-card", "aria-labelledby": "forgot-title" }, [
    title, sub, emailForm, resetForm,
    el("p", { class: "auth-foot" }, [el("a", { href: "#/login" }, ["Volver al inicio de sesión"])]),
  ]);
  const shell = buildAuthShell(card);
  container.replaceChildren(shell.layout);
  emailInput.focus();

  function startCooldown() {
    clearInterval(resendTimer);
    let left = RESEND_SECONDS;
    const tick = () => {
      if (left <= 0) {
        clearInterval(resendTimer);
        resend.disabled = false;
        resend.textContent = "Reenviar código";
        return;
      }
      resend.disabled = true;
      resend.textContent = `Reenviar en ${left} s`;
      left -= 1;
    };
    tick();
    resendTimer = setInterval(tick, 1000);
  }

  function refreshControls() {
    for (const [button, form] of [[requestBtn, emailForm], [resetBtn, resetForm]]) {
      button.disabled = loading;
      button.classList.toggle("is-loading", loading);
      button.setAttribute("aria-busy", String(loading));
      form.toggleAttribute("aria-busy", loading);
    }
  }

  return {
    setHealth: shell.setHealth,
    // Pasa al paso 2 y arranca la espera de reenvío.
    showCodeStep(email) {
      emailForm.hidden = true;
      resetForm.hidden = false;
      title.textContent = "Revisa tu correo";
      sub.replaceChildren("Si ", el("strong", {}, [maskEmail(email)]), " está registrado, enviamos un código. Escríbelo y elige tu contraseña nueva.");
      startCooldown();
      codeInput.focus();
    },
    setLoading(value) {
      loading = value;
      refreshControls();
    },
    restartCooldown() { startCooldown(); },
    clearCode() { codeInput.value = ""; codeInput.focus(); },
    destroy() { clearInterval(resendTimer); },
  };
}
