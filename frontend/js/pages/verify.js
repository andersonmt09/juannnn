function renderVerify(container) {
  container.innerHTML = "";
  const email = localStorage.getItem("axon_pending_email") || "";
  const purpose = localStorage.getItem("axon_pending_purpose") || "login";
  const isReg = purpose === "registration";

  const card = UI.el("div", { class: "auth-card" }, [
    UI.el("h1", {}, ["Verificación"]),
    UI.el("p", { class: "muted" }, [isReg ? "Hemos enviado un código a tu correo para verificar tu cuenta." : "Ingresa el código de 6 dígitos enviado a tu correo."]),
    UI.el("p", { class: "muted small" }, ["Correo: " + (email || "(sin correo)")]),
    UI.el("form", { id: "verify-form" }, [
      UI.el("label", {}, ["Código de verificación (6 dígitos)"]),
      UI.el("input", { type: "text", name: "code", required: "true", maxlength: "6", pattern: "[0-9]{6}", placeholder: "123456", autocomplete: "one-time-code" }),
      UI.el("button", { type: "submit", class: "btn btn-primary" }, ["Verificar"]),
    ]),
    UI.el("div", { class: "row small" }, [
      UI.el("button", { id: "resend-btn", class: "btn btn-link" }, ["Reenviar código"]),
      UI.el("a", { href: "#/login", class: "btn btn-link" }, ["Volver"]),
    ]),
  ]);
  container.appendChild(card);

  card.querySelector("#verify-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const code = new FormData(e.target).get("code");
    const btn = e.target.querySelector("button");
    btn.disabled = true; btn.textContent = "Verificando...";
    try {
      if (isReg) {
        await window.API.request("/auth/verify-registration", { method: "POST", body: { email, code } });
        UI.toast("Correo verificado. Ya puedes iniciar sesión.", "success");
        localStorage.removeItem("axon_pending_email"); localStorage.removeItem("axon_pending_purpose");
        location.hash = "#/login";
      } else {
        const res = await window.API.request("/auth/verify-code", { method: "POST", body: { email, code } });
        window.API.setTokens(res.token, res.refreshToken);
        window.API.setUser(res.user);
        localStorage.removeItem("axon_pending_email"); localStorage.removeItem("axon_pending_purpose");
        UI.toast("Bienvenido, " + (res.user.name || ""), "success");
        location.hash = "#/dashboard";
      }
    } catch (err) {
      UI.toast(err.message || "Código inválido", "error");
    } finally {
      btn.disabled = false; btn.textContent = "Verificar";
    }
  });

  card.querySelector("#resend-btn").addEventListener("click", async () => {
    try {
      const endpoint = isReg ? "/auth/resend-registration" : "/auth/resend-code";
      await window.API.request(endpoint, { method: "POST", body: { email } });
      UI.toast("Código reenviado", "success");
    } catch (err) {
      UI.toast(err.message || "Error al reenviar", "error");
    }
  });
}
window.renderVerify = renderVerify;
