function renderRegister(container) {
  container.innerHTML = "";
  const card = UI.el("div", { class: "auth-card" }, [
    UI.el("div", { class: "auth-brand" }, ["AXON STACK FLOW"]),
    UI.el("h1", {}, ["Crear cuenta"]),
    UI.el("p", { class: "muted" }, ["Regístrate para empezar a usar el panel"]),
    UI.el("form", { id: "register-form" }, [
      UI.el("label", {}, ["Nombre completo"]),
      UI.el("input", { type: "text", name: "name", required: "true", minlength: "2", placeholder: "Tu nombre" }),
      UI.el("label", {}, ["Correo electrónico"]),
      UI.el("input", { type: "email", name: "email", required: "true", placeholder: "tu@correo.com" }),
      UI.el("label", {}, ["Contraseña (min 6)"]),
      UI.el("input", { type: "password", name: "password", required: "true", minlength: "6" }),
      UI.el("button", { type: "submit", class: "btn btn-primary" }, ["Registrarse"]),
    ]),
    UI.el("p", { class: "muted small" }, [
      "¿Ya tienes cuenta? ",
      UI.el("a", { href: "#/login" }, ["Inicia sesión"]),
    ]),
  ]);
  container.appendChild(card);

  card.querySelector("#register-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = { name: fd.get("name"), email: fd.get("email"), password: fd.get("password") };
    const btn = e.target.querySelector("button");
    btn.disabled = true; btn.textContent = "Enviando...";
    try {
      const res = await window.API.request("/auth/register", { method: "POST", body });
      localStorage.setItem("axon_pending_email", res.email);
      localStorage.setItem("axon_pending_purpose", "registration");
      UI.toast("Código de verificación enviado a tu correo", "success");
      location.hash = "#/verify";
    } catch (err) {
      UI.toast(err.message || "Error al registrarse", "error");
    } finally {
      btn.disabled = false; btn.textContent = "Registrarse";
    }
  });
}
window.renderRegister = renderRegister;
