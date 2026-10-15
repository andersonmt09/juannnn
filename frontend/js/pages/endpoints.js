async function renderEndpoints(container) {
  container.innerHTML = "";
  const isAdmin = window.AUTH.isAdmin();
  const header = UI.el("div", { class: "page-header row-between" }, [
    UI.el("h2", {}, ["Endpoints"]),
    isAdmin ? UI.el("button", { id: "new-endpoint-btn", class: "btn btn-primary" }, ["+ Nuevo"]) : UI.el("span", {}, [""]),
  ]);
  const formWrap = UI.el("div", { id: "endpoint-form-wrap", class: "panel hidden" });
  formWrap.innerHTML = `<h3>Nuevo endpoint</h3>
    <form id="endpoint-form">
      <label>Nombre</label><input name="name" required />
      <label>Ruta</label><input name="path" required placeholder="/api/recurso" />
      <label>Método</label>
      <select name="method"><option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option></select>
      <label>Descripción</label><input name="description" />
      <div class="row"><button type="submit" class="btn btn-primary">Guardar</button><button type="button" class="btn" id="cancel-ep">Cancelar</button></div>
    </form>`;
  const tableWrap = UI.el("div", { class: "panel" });
  container.append(header, formWrap, tableWrap);

  if (isAdmin) {
    document.getElementById("new-endpoint-btn").addEventListener("click", () => formWrap.classList.toggle("hidden"));
    formWrap.querySelector("#cancel-ep").addEventListener("click", () => formWrap.classList.add("hidden"));
    formWrap.querySelector("#endpoint-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const body = { name: fd.get("name"), path: fd.get("path"), method: fd.get("method"), description: fd.get("description") };
      try {
        await window.API.request("/axon/endpoints", { method: "POST", body });
        UI.toast("Endpoint creado", "success");
        formWrap.classList.add("hidden");
        e.target.reset();
        await loadEndpoints(tableWrap, isAdmin);
      } catch (err) { UI.toast(err.message || "Error", "error"); }
    });
  }

  await loadEndpoints(tableWrap, isAdmin);
}

async function loadEndpoints(tableWrap, isAdmin) {
  tableWrap.innerHTML = "<p class='muted'>Cargando...</p>";
  try {
    const res = await window.API.request("/axon/endpoints");
    const data = res.data || [];
    tableWrap.innerHTML = "";
    if (data.length === 0) { tableWrap.appendChild(UI.el("p", { class: "muted" }, ["Sin endpoints."])); return; }
    const table = document.createElement("table");
    table.className = "table";
    table.innerHTML = "<thead><tr><th>ID</th><th>Nombre</th><th>Ruta</th><th>Método</th><th>Descripción</th>" + (isAdmin ? "<th>Acciones</th>" : "") + "</tr></thead><tbody></tbody>";
    const tbody = table.querySelector("tbody");
    data.forEach((ep) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${ep.id}</td><td>${escapeHtml(ep.name)}</td><td>${escapeHtml(ep.path)}</td>
        <td><span class="badge method-${ep.method}">${ep.method}</span></td><td class="small">${escapeHtml(ep.description || "")}</td>
        ${isAdmin ? `<td><button class="btn btn-sm btn-danger" data-id="${ep.id}">Eliminar</button></td>` : ""}`;
      tbody.appendChild(tr);
    });
    tableWrap.appendChild(table);
    if (isAdmin) {
      table.addEventListener("click", async (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        if (!confirm("¿Eliminar endpoint?")) return;
        try {
          await window.API.request("/axon/endpoints/" + btn.dataset.id, { method: "DELETE" });
          UI.toast("Eliminado", "success");
          await loadEndpoints(tableWrap, isAdmin);
        } catch (err) { UI.toast(err.message || "Error", "error"); }
      });
    }
  } catch (err) {
    tableWrap.innerHTML = "<p class='muted'>Error al cargar.</p>";
    UI.toast(err.message || "Error", "error");
  }
}

function escapeHtml(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

window.renderEndpoints = renderEndpoints;
if (!window.escapeHtml) window.escapeHtml = escapeHtml;
