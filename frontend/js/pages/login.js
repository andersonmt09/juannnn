function renderLogin(container) {
  container.innerHTML = "";
  const card = UI.el("div", { class: "auth-card" }, [
    UI.el("div", { class: "auth-brand" }, ["AXON STACK FLOW"]),
    UI.el("h1", {}, ["Bienvenido de nuevo"]),
    UI.el("p", { class: "muted" }, ["Inicia sesión para acceder al panel de control"]),
    UI.el("form", { id: "login-form" }, [
      UI.el("label", {}, ["Correo electrónico"]),
      UI.el("input", { type: "email", name: "email", required: "true", placeholder: "admin@axon.com" }),
      UI.el("label", {}, ["Contraseña"]),
      UI.el("input", { type: "password", name: "password", required: "true", placeholder: "••••••" }),
      UI.el("button", { type: "submit", class: "btn btn-primary" }, ["Ingresar"]),
    ]),
    UI.el("p", { class: "muted small" }, [
      "¿No tienes cuenta? ",
      UI.el("a", { href: "#/register" }, ["Regístrate"]),
    ]),
  ]);
  container.appendChild(card);

  const form = card.querySelector("#login-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const email = fd.get("email");
    const password = fd.get("password");
    const btn = form.querySelector("button");
    btn.disabled = true; btn.textContent = "Verificando...";
    try {
      const res = await window.API.request("/auth/login", { method: "POST", body: { email, password } });
      // store pending verification
      localStorage.setItem("axon_pending_email", res.email);
      localStorage.setItem("axon_pending_purpose", "login");
      location.hash = "#/verify";
    } catch (err) {
      UI.toast(err.message || "Error al iniciar sesión", "error");
    } finally {
      btn.disabled = false; btn.textContent = "Ingresar";
    }
  });
}
window.renderLogin = renderLogin;
