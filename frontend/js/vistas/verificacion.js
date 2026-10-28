import { el, icon, maskEmail } from "../utilidades.js";

const RESEND_SECONDS = 30; // espera entre reenvíos

const clock = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

export function renderVerifyView(container, { email, isRegistration, expiresAt }, { onSubmit, onResend }) {
  let loading = false;
  let expired = false;
  let expiryTimer = null;
  let resendTimer = null;

  const submit = el("button", { type: "submit", class: "btn btn-primary btn-block" }, [el("span", {}, ["Verificar"])]);
  const input = el("input", {
    id: "verify-code", name: "code", class: "otp-input", required: true, maxlength: "6", pattern: "[0-9]{6}",
    inputmode: "numeric", autocomplete: "one-time-code", placeholder: "······", "aria-label": "Código de verificación de 6 dígitos",
    "aria-describedby": "verify-countdown",
  });
  const countdown = el("p", { id: "verify-countdown", class: "countdown", role: "timer" });
  const resend = el("button", { type: "button", class: "btn btn-ghost btn-sm" }, ["Reenviar código"]);
  const form = el("form", {}, [input, countdown, submit]);

  function send() {
    if (loading || expired) return;
    const code = input.value;
    if (/^\d{6}$/.test(code)) onSubmit(code);
    else input.reportValidity();
  }

  form.addEventListener("submit", (event) => { event.preventDefault(); send(); });
  // con 6 dígitos (escritos o pegados) se envía solo
  input.addEventListener("input", () => {
    input.value = input.value.replace(/\D/g, "").slice(0, 6);
    if (input.value.length === 6) send();
  });
  resend.addEventListener("click", () => onResend());

  function refreshControls() {
    submit.disabled = loading || expired;
    input.disabled = loading;
    submit.classList.toggle("is-loading", loading);
  }

  function startExpiry(deadline) {
    clearInterval(expiryTimer);
    expired = false;
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      if (left <= 0) {
        expired = true;
        clearInterval(expiryTimer);
        countdown.textContent = "El código venció. Solicita uno nuevo.";
        countdown.dataset.expired = "true";
      } else {
        countdown.textContent = `El código vence en ${clock(left)}`;
        delete countdown.dataset.expired;
      }
      refreshControls();
    };
    tick();
    expiryTimer = setInterval(tick, 1000);
  }

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

  container.replaceChildren(el("div", { class: "auth-layout" }, [
    el("main", { class: "auth-main", style: "grid-column: 1 / -1" }, [
      el("section", { class: "auth-card is-centered", "aria-labelledby": "verify-title" }, [
        el("div", { class: "verify-icon" }, [icon("mail")]),
        el("h1", { id: "verify-title" }, ["Revisa tu correo"]),
        el("p", { class: "auth-sub" }, [
          isRegistration ? "Enviamos un código para confirmar tu cuenta a " : "Enviamos un código de acceso a ",
          el("strong", {}, [maskEmail(email)]),
        ]),
        form,
        el("div", { class: "row", style: "justify-content:center;margin-top:16px" }, [
          resend,
          el("a", { href: "#/login", class: "btn btn-link" }, ["Volver"]),
        ]),
      ]),
    ]),
  ]));
  input.focus();
  startExpiry(expiresAt);
  startCooldown();

  return {
    setLoading(value) {
      loading = value;
      refreshControls();
      if (!value && !expired) input.focus();
    },
    restartTimers(newExpiresAt) {
      input.value = "";
      startExpiry(newExpiresAt);
      startCooldown();
      input.focus();
    },
    clearCode() { input.value = ""; input.focus(); },
    destroy() {
      clearInterval(expiryTimer);
      clearInterval(resendTimer);
    },
  };
}
