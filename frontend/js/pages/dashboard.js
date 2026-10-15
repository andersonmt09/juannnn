async function renderDashboard(container) {
  container.innerHTML = "";
  const u = window.AUTH.currentUser();
  const header = UI.el("div", { class: "page-header" }, [
    UI.el("div", {}, [
      UI.el("h2", {}, ["Dashboard"]),
      UI.el("div", { class: "page-subtitle" }, ["Resumen del sistema y actividad reciente · " + (u ? u.name : "")]),
    ]),
  ]);
  const cards = UI.el("div", { class: "cards" });
  const mid = UI.el("div", { class: "grid-2" }, [
    UI.el("div", { class: "panel" }, [
      UI.el("h3", {}, ["Códigos de respuesta"]),
      UI.el("canvas", { id: "chart-status", height: "200" }),
    ]),
    UI.el("div", { class: "panel" }, [
      UI.el("h3", {}, ["Peticiones por método"]),
      UI.el("canvas", { id: "chart-method", height: "200" }),
    ]),
  ]);
  const recentWrap = UI.el("div", { class: "panel" }, []);
  const recentHead = UI.el("div", { class: "row-between", style: "margin-bottom:12px" }, [
    UI.el("h3", { style: "margin:0" }, ["Actividad reciente"]),
    UI.el("button", { class: "btn btn-sm", id: "export-logs-btn" }, ["⬇ Exportar CSV"]),
  ]);
  recentWrap.append(recentHead, UI.el("div", { id: "recent-logs" }, [UI.el("div", { class: "muted small" }, ["Cargando..."]) ]));
  container.append(header, cards, mid, recentWrap);

  // inject grid-2 style inline? add class to css? We'll add via style attribute
  mid.style.display = "grid";
  mid.style.gridTemplateColumns = "1fr 1fr";
  mid.style.gap = "22px";

  try {
    const res = await window.API.request("/metrics/dashboard");
    const d = res.data;
    const s = d.summary;
    const cardData = [
      { label: "Usuarios totales", value: s.usersTotal, icon: "users" },
      { label: "Usuarios activos", value: s.usersActive, icon: "check" },
      { label: "Administradores", value: s.usersAdmin, icon: "shield" },
      { label: "Endpoints registrados", value: s.endpoints, icon: "link" },
      { label: "Peticiones (24h)", value: s.logsLast24h, icon: "chart" },
      { label: "Latencia promedio", value: s.avgLatencyMs + " ms", icon: "bolt" },
    ];
    cards.innerHTML = "";
    cardData.forEach((c) => {
      const cd = UI.el("div", { class: "card" });
      const ic = UI.el("div", { class: "card-icon" }); ic.appendChild(UI.icon(c.icon));
      cd.append(ic, UI.el("div", { class: "card-value" }, [String(c.value)]), UI.el("div", { class: "card-label" }, [c.label]));
      cards.appendChild(cd);
    });

    if (window.Chart) {
      renderChart("chart-status", d.logsByStatus.map((x) => String(x.status)), d.logsByStatus.map((x) => x.count), ["#4ade80","#3dd6c6","#f4b942","#ff6b7a","#ff6b7a"]);
      renderChart("chart-method", d.logsByMethod.map((x) => x.method), d.logsByMethod.map((x) => x.count), ["#3dd6c6","#f4b942","#6ae3d6","#4ade80","#ff6b7a"]);
    }

    const rl = document.getElementById("recent-logs");
    rl.innerHTML = "";
    if (!d.recentLogs || d.recentLogs.length === 0) {
      rl.appendChild(emptyState("Sin actividad", "Aún no se registran peticiones al API."));
    } else {
      const table = document.createElement("table");
      table.className = "table";
      table.innerHTML = "<thead><tr><th>Método</th><th>Ruta</th><th>Estado</th><th>Latencia</th><th>Origen</th><th>Fecha</th></tr></thead><tbody></tbody>";
      const tbody = table.querySelector("tbody");
      d.recentLogs.forEach((l) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td><span class="badge method-${l.method}">${l.method}</span></td>
          <td class="mono small">${escapeHtml(l.path)}</td>
          <td><span class="badge status-${Math.floor(l.status_code/100)}">${l.status_code}</span></td>
          <td class="small">${l.latency_ms} ms</td>
          <td class="small muted">${escapeHtml(l.source || "—")}</td>
          <td class="small">${new Date(l.created_at).toLocaleString()}</td>`;
        tbody.appendChild(tr);
      });
      rl.appendChild(table);
    }
    const exportBtn = document.getElementById("export-logs-btn");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => exportCSV(d.recentLogs || [], "axon-logs.csv", [
        ["id","id"],["method","method"],["path","path"],["status_code","estado"],["latency_ms","latencia_ms"],["created_at","fecha"],
      ]));
    }
  } catch (err) {
    cards.innerHTML = "";
    cards.appendChild(UI.el("p", { class: "muted" }, ["No se pudo cargar el dashboard."]));
    UI.toast(err.message || "Error", "error");
  }
}

function renderBreakdown(id, items, max) {
  const el = document.getElementById(id);
  el.innerHTML = "";
  if (!items || items.length === 0) { el.appendChild(UI.el("p", { class: "muted small" }, ["Sin datos."])); return; }
  const wrap = document.createElement("div"); wrap.className = "breakdown";
  items.forEach((it) => {
    const row = document.createElement("div"); row.className = "bar-row";
    const pct = max ? Math.round((it.value / max) * 100) : 0;
    row.innerHTML = `<div class="bar-label mono">${escapeHtml(String(it.label))}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
      <div class="bar-value">${it.value}</div>`;
    wrap.appendChild(row);
  });
  el.appendChild(wrap);
}

function emptyState(title, text) {
  const d = document.createElement("div"); d.className = "empty";
  d.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M9 9h.01M15 9h.01M9 15s1.5 2 3 2 3-2 3-2"/></svg>
    <h4>${escapeHtml(title)}</h4><p>${escapeHtml(text)}</p>`;
  return d;
}

function renderChart(canvasId, labels, data, colors) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !window.Chart) return;
  if (canvas._chart) canvas._chart.destroy();
  canvas._chart = new window.Chart(canvas.getContext("2d"), {
    type: "doughnut",
    data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 6 }] },
    options: {
      cutout: "68%",
      plugins: {
        legend: { position: "bottom", labels: { color: "#9aa0c3", padding: 12, boxWidth: 12, font: { size: 11 } } },
      },
    },
  });
}

function toCSV(rows, columns) {
  const header = columns.map((c) => c[1]).join(",");
  const body = (rows || []).map((r) =>
    columns.map((c) => {
      const v = r[c[0]];
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(",")
  ).join("\n");
  return header + "\n" + body;
}

function exportCSV(rows, filename, columns) {
  const csv = "\uFEFF" + toCSV(rows, columns);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  UI.toast("Exportado: " + filename, "success");
}

function escapeHtml(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

window.renderDashboard = renderDashboard;