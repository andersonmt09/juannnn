const appEl = () => document.getElementById("app");

function buildShell() {
  appEl().innerHTML = "";
  const u = (window.AUTH && window.AUTH.currentUser) ? window.AUTH.currentUser() : null;
  const initials = (u && u.name ? u.name : "?")
    .split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  const shell = document.createElement("div");
  shell.className = "shell";

  const sidebar = document.createElement("aside");
  sidebar.className = "sidebar";

  const brand = document.createElement("div");
  brand.className = "brand";
  brand.appendChild(UI.icon("logo", "brand-dot"));
  const brandText = document.createElement("span");
  brandText.textContent = "AXON";
  brand.appendChild(brandText);

  const navSection = document.createElement("div");
  navSection.className = "nav-section";
  navSection.textContent = "Principal";

  const nav = document.createElement("nav");
  const items = [
    ["#/dashboard", "chart", "Dashboard"],
    ["#/users", "users", "Usuarios"],
    ["#/endpoints", "link", "Endpoints"],
    ["#/profile", "shield", "Perfil"],
  ];
  items.forEach(([href, ic, label]) => {
    const a = document.createElement("a");
    a.href = href;
    a.className = "nav-item";
    a.dataset.route = href;
    a.appendChild(UI.icon(ic, "nav-icon"));
    const span = document.createElement("span");
    span.textContent = label;
    a.appendChild(span);
    nav.appendChild(a);
  });

  const userBlock = document.createElement("div");
  userBlock.className = "user-block";
  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = initials;
  const info = document.createElement("div");
  const nm = document.createElement("div");
  nm.className = "name";
  nm.textContent = u ? u.name : "—";
  const rl = document.createElement("div");
  rl.className = "role";
  rl.textContent = u ? u.role : "";
  info.append(nm, rl);
  userBlock.append(avatar, info);

  const footer = document.createElement("div");
  footer.className = "sidebar-footer";

  const themeBtn = document.createElement("button");
  themeBtn.type = "button";
  themeBtn.className = "btn btn-ghost full";
  const applyThemeLabel = (mode) => { themeBtn.textContent = mode === "light" ? "Modo oscuro" : "Modo claro"; };
  const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
  applyThemeLabel(currentTheme);
  themeBtn.addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme") || "dark";
    const next = cur === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("axon_theme", next); } catch (e) {}
    applyThemeLabel(next);
  });
  footer.appendChild(themeBtn);

  const logoutBtn = document.createElement("button");
  logoutBtn.id = "logout-btn";
  logoutBtn.type = "button";
  logoutBtn.className = "btn btn-ghost full";
  logoutBtn.appendChild(UI.icon("logout", "nav-icon"));
  const lt = document.createElement("span");
  lt.textContent = " Cerrar sesion";
  logoutBtn.appendChild(lt);
  footer.appendChild(logoutBtn);

  sidebar.append(brand, navSection, nav, userBlock, footer);

  const main = document.createElement("main");
  main.className = "main";
  const page = document.createElement("div");
  page.id = "page";
  main.appendChild(page);

  shell.append(sidebar, main);
  appEl().appendChild(shell);

  logoutBtn.addEventListener("click", () => window.AUTH.logout());
  const hash = location.hash || "#/dashboard";
  nav.querySelectorAll("a").forEach((a) => {
    if (a.getAttribute("href") === hash) a.classList.add("active");
  });
}

const routes = {
  "#/login": (c) => window.renderLogin(c),
  "#/register": (c) => window.renderRegister(c),
  "#/verify": (c) => window.renderVerify(c),
  "#/dashboard": (c) => window.renderDashboard(c),
  "#/users": (c) => window.renderUsers(c),
  "#/endpoints": (c) => window.renderEndpoints(c),
  "#/profile": (c) => window.renderProfile(c),
};

function navigate() {
  const hash = location.hash || (window.AUTH.isLoggedIn() ? "#/dashboard" : "#/login");
  if (!location.hash) { location.hash = hash; return; }

  if (!window.AUTH.isLoggedIn()) {
    if (hash !== "#/login" && hash !== "#/register" && !hash.startsWith("#/verify")) {
      location.hash = "#/login";
      return;
    }
    appEl().innerHTML = "";
    const container = document.createElement("div");
    container.id = "auth-container";
    appEl().appendChild(container);
    const fn = routes[hash] || routes["#/login"];
    fn(container);
    return;
  }

  if (hash === "#/login" || hash === "#/register") {
    location.hash = "#/dashboard";
    return;
  }
  const needsShell = !document.querySelector(".shell");
  if (needsShell) buildShell();
  document.querySelectorAll(".sidebar nav a").forEach((a) => {
    a.classList.toggle("active", a.getAttribute("href") === hash);
  });
  const page = document.getElementById("page");
  page.innerHTML = "";
  const fn = routes[hash] || routes["#/dashboard"];
  fn(page);
}

window.addEventListener("hashchange", navigate);
window.addEventListener("DOMContentLoaded", navigate);
setTimeout(navigate, 0);