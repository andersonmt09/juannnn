let usersCache = [];
let modalState = { editingId: null, tableWrap: null, showModal: null, hideModal: null };

async function renderUsers(container) {
  container.innerHTML = "";
  if (!window.AUTH.isAdmin()) {
    container.appendChild(UI.el("p", { class: "muted" }, ["Acceso restringido. Solo administradores."]));
    return;
  }
  const header = UI.el("div", { class: "page-header row-between" }, [
    UI.el("h2", {}, ["Usuarios"]),
    UI.el("div", { class: "row" }, [
      UI.el("button", { id: "export-users-btn", class: "btn" }, ["⬇ Exportar CSV"]),
      UI.el("button", { id: "new-user-btn", class: "btn btn-primary" }, ["+ Nuevo usuario"]),
    ]),
  ]);
  const tableWrap = UI.el("div", { class: "panel" });
  container.append(header, tableWrap);

  const modal = UI.el("div", { id: "user-modal", class: "modal hidden" });
  modal.innerHTML = `<div class="modal-backdrop"></div>
    <div class="modal-card">
      <h3 id="modal-title">Usuario</h3>
      <form id="user-form">
        <label>Nombre</label>
        <input name="name" required minlength="2" />
        <label>Correo</label>
        <input name="email" type="email" required />
        <label>Rol</label>
        <select name="role"><option value="user">user</option><option value="admin">admin</option></select>
        <label id="pwd-label">Contraseña</label>
        <input name="password" type="password" minlength="6" />
        <div class="row">
          <button type="submit" class="btn btn-primary">Guardar</button>
          <button type="button" class="btn" id="modal-cancel">Cancelar</button>
        </div>
      </form>
    </div>`;
  container.appendChild(modal);

  const form = modal.querySelector("#user-form");
  const cancel = modal.querySelector("#modal-cancel");
  const backdrop = modal.querySelector(".modal-backdrop");
  const title = modal.querySelector("#modal-title");

  function showModal(user = null) {
    modalState.editingId = user ? user.id : null;
    title.textContent = user ? "Editar usuario" : "Nuevo usuario";
    form.name.value = user ? user.name : "";
    form.email.value = user ? user.email : "";
    form.role.value = user ? user.role : "user";
    form.password.value = "";
    form.password.required = !user;
    modal.querySelector("#pwd-label").textContent = user ? "Nueva contraseña (opcional)" : "Contraseña";
    modal.classList.remove("hidden");
  }
  function hideModal(){ modal.classList.add("hidden"); modalState.editingId = null; }

  modalState.showModal = showModal;
  modalState.hideModal = hideModal;
  modalState.tableWrap = tableWrap;

  cancel.addEventListener("click", hideModal);
  backdrop.addEventListener("click", hideModal);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      const editingId = modalState.editingId;
      if (editingId) {
        const body = { name: fd.get("name"), email: fd.get("email"), role: fd.get("role") };
        await window.API.request("/users/" + editingId, { method: "PUT", body });
        const pwd = fd.get("password");
        if (pwd) {
          await window.API.request("/users/" + editingId + "/password", { method: "PATCH", body: { password: pwd } });
        }
        UI.toast("Usuario actualizado", "success");
      } else {
        const body = { name: fd.get("name"), email: fd.get("email"), password: fd.get("password"), role: fd.get("role") };
        await window.API.request("/users", { method: "POST", body });
        UI.toast("Usuario creado", "success");
      }
      hideModal();
      await loadUsers(tableWrap);
    } catch (err) {
      UI.toast(err.message || "Error", "error");
    } finally {
      btn.disabled = false;
    }
  });

  document.getElementById("new-user-btn").addEventListener("click", () => showModal(null));
  const exportBtn = document.getElementById("export-users-btn");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => exportCSV(usersCache, "axon-users.csv", [
      ["id","id"],["name","nombre"],["email","correo"],["role","rol"],["email_verified","verificado"],["created_date","creado"],
    ]));
  }
  await loadUsers(tableWrap);
}

async function loadUsers(tableWrap) {
  tableWrap.innerHTML = "<p class='muted'>Cargando...</p>";
  try {
    const res = await window.API.request("/users");
    usersCache = res.data || [];
    renderTable(tableWrap);
  } catch (err) {
    tableWrap.innerHTML = "<p class='muted'>Error al cargar usuarios.</p>";
    UI.toast(err.message || "Error", "error");
  }
}

function renderTable(tableWrap) {
  tableWrap.innerHTML = "";
  const table = document.createElement("table");
  table.className = "table";
  table.innerHTML = "<thead><tr><th>ID</th><th>Nombre</th><th>Correo</th><th>Rol</th><th>Verificado</th><th>Acciones</th></tr></thead><tbody></tbody>";
  const tbody = table.querySelector("tbody");
  const current = window.AUTH.currentUser();
  usersCache.forEach((u) => {
    const tr = document.createElement("tr");
    const isSelf = current && current.id === u.id;
    const isSample = u.is_sample;
    tr.innerHTML = `
      <td>${u.id}</td>
      <td>${escapeHtml(u.name)}</td>
      <td>${escapeHtml(u.email)}</td>
      <td><span class="badge role-${u.role}">${u.role}</span></td>
      <td>${u.email_verified ? "✅" : "❌"}</td>
      <td class="actions">
        <button class="btn btn-sm" data-action="edit" data-id="${u.id}">Editar</button>
        <button class="btn btn-sm btn-danger" data-action="delete" data-id="${u.id}" ${isSelf || isSample ? "disabled" : ""}>Eliminar</button>
      </td>`;
    tbody.appendChild(tr);
  });
  tableWrap.appendChild(table);

  table.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const id = btn.dataset.id;
    const user = usersCache.find((x) => String(x.id) === String(id));
    const action = btn.dataset.action;
    if (action === "edit") {
      modalState.showModal(user);
    } else if (action === "delete") {
      if (!confirm("¿Eliminar este usuario? (eliminación lógica)")) return;
      try {
        await window.API.request("/users/" + id, { method: "DELETE" });
        UI.toast("Usuario eliminado", "success");
        await loadUsers(tableWrap);
      } catch (err) {
        UI.toast(err.message || "Error", "error");
      }
    }
  });
}

function escapeHtml(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

window.renderUsers = renderUsers;
