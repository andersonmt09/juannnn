import { pageHeader, passwordField, badge } from "./componentes.js";
import { el, initials, formatDate } from "../utilidades.js";

const ROLE_LABEL = { admin: "Administrador", user: "Usuario" };

export function renderProfileView(container, { user }, { onChangePassword }) {
  const identity = el("div", { class: "card profile-card" });

  function setUser(next) {
    identity.replaceChildren(
      el("span", { class: "avatar avatar-lg" }, [initials(next.name)]),
      el("div", { class: "profile-name" }, [next.name]),
      el("div", { class: "muted" }, [next.email]),
      el("div", { class: "profile-meta" }, [
        badge(ROLE_LABEL[next.role] || next.role, next.role === "admin" ? "accent" : "neutral"),
        next.emailVerified === undefined ? null : badge(next.emailVerified ? "Correo verificado" : "Sin verificar", next.emailVerified ? "success" : "warning"),
      ]),
      next.createdDate ? el("div", { class: "profile-since" }, [`Miembro desde ${formatDate(next.createdDate)}`]) : null
    );
  }
  setUser(user);

  const current = passwordField({ id: "profile-current-password", name: "currentPassword", label: "Contraseña actual", autocomplete: "current-password" });
  const next = passwordField({ id: "profile-password", name: "password", label: "Nueva contraseña", autocomplete: "new-password", hint: "Entre 8 y 72 caracteres", minlength: 8 });
  next.input.maxLength = 72;
  const confirm = passwordField({ id: "profile-confirm-password", name: "confirmPassword", label: "Confirmar nueva contraseña", autocomplete: "new-password", minlength: 8 });
  confirm.input.maxLength = 72;
  const submit = el("button", { type: "submit", class: "btn btn-primary" }, ["Guardar contraseña"]);
  const form = el("form", {}, [current, next, confirm, el("div", { class: "row" }, [submit])]);
  form.querySelector(".row").style.marginTop = "var(--sp-5)";

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    onChangePassword({
      currentPassword: current.input.value,
      password: next.input.value,
      confirmPassword: confirm.input.value,
    });
  });

  container.replaceChildren(
    pageHeader({ title: "Mi perfil", subtitle: "Tus datos y la seguridad de tu cuenta" }),
    el("div", { class: "grid-1-2" }, [
      identity,
      el("div", { class: "card" }, [el("div", { class: "card-header" }, [el("h2", {}, ["Cambiar contraseña"])]), form]),
    ])
  );

  return {
    setUser,
    setSaving(saving) {
      submit.classList.toggle("is-loading", saving);
      submit.disabled = saving;
    },
    resetForm() {
      form.reset();
    },
  };
}
