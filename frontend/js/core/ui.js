function toast(msg, type = "info") {
  let wrap = document.getElementById("toast-wrap");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.id = "toast-wrap";
    wrap.className = "toast-wrap";
    document.body.appendChild(wrap);
  }
  const t = document.createElement("div");
  t.className = "toast toast-" + type;
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => { t.classList.add("hide"); setTimeout(() => t.remove(), 300); }, 3200);
}

function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  for (const k in attrs) {
    if (k === "class") e.className = attrs[k];
    else if (k === "html") e.innerHTML = attrs[k];
    else e.setAttribute(k, attrs[k]);
  }
  (Array.isArray(children) ? children : [children]).forEach((c) => {
    if (c == null) return;
    if (typeof c === "string") e.appendChild(document.createTextNode(c));
    else e.appendChild(c);
  });
  return e;
}

function skeleton() { return el("div", { class: "skeleton" }); }

function icon(name, cls = "") {
  const paths = {
    users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm7-6a3 3 0 1 1 0 6 3 3 0 1 1 0-6zm8 16v-2a3 3 0 0 0-3-3h-1",
    check: "M20 6 9 17l-5-5",
    shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    link: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
    chart: "M3 3v18h18M7 16l4-8 4 5 4-9",
    bolt: "M13 2 3 14h9l-1 8 10-12h-9l1-8z",
    plus: "M12 5v14M5 12h14",
    edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
    trash: "M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z",
    logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
    logo: "M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  };
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("class", (cls ? cls + " " : "") + "icon");
  svg.innerHTML = `<path d="${paths[name] || paths.logo}"/>`;
  return svg;
}

function toast(msg, type = "info") {
  const wrap = document.getElementById("toast-wrap");
  const icons = { success: "check", error: "trash", info: "logo" };
  const t = document.createElement("div");
  t.className = "toast toast-" + type;
  t.appendChild(icon(icons[type] || "logo", "toast-icon"));
  const span = document.createElement("span");
  span.textContent = msg;
  t.appendChild(span);
  wrap.appendChild(t);
  setTimeout(() => { t.classList.add("hide"); setTimeout(() => t.remove(), 260); }, 3400);
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
  toast("Exportado: " + filename, "success");
}

window.UI = { toast, el, skeleton, icon, exportCSV };
window.ICONS = { icon };
window.exportCSV = exportCSV;
