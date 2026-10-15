function renderProfile(container) {
  container.innerHTML = "";
  const u = window.AUTH.currentUser();
  const card = UI.el("div", { class: "panel" }, [
    UI.el("h2", {}, ["Mi perfil"]),
    UI.el("p", {}, ["Nombre: " + (u ? u.name : "")]),
    UI.el("p", {}, ["Correo: " + (u ? u.email : "")]),
    UI.el("p", {}, ["Rol: " + (u ? u.role : "")]),
  ]);
  const formWrap = UI.el("div", { class: "panel" });
  formWrap.innerHTML = `<h3>Cambiar contraseña</h3>
    <form id="pwd-form">
      <label>Nueva contraseña (min 6)</label>
      <input name="password" type="password" required minlength="6" />
      <button type="submit" class="btn btn-primary">Actualizar</button>
    </form>`;
  container.append(card, formWrap);

  formWrap.querySelector("#pwd-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const pwd = fd.get("password");
    if (!u) return;
    try {
      await window.API.request("/users/" + u.id + "/password", { method: "PATCH", body: { password: pwd } });
      UI.toast("Contraseña actualizada", "success");
      e.target.reset();
    } catch (err) { UI.toast(err.message || "Error", "error"); }
  });
}
window.renderProfile = renderProfile;
