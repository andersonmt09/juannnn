// FRONTEND/js/app.js: la cargan todas las páginas de vistas/. Revisa la sesión y dibuja la pantalla.
import { showLogin } from "./controladores/inicio-sesion.js";
import { showRegister } from "./controladores/registro.js";
import { showVerify } from "./controladores/verificacion.js";
import { showDashboard } from "./controladores/panel.js";
import { showUsers } from "./controladores/usuarios.js";
import { showMonitoring } from "./controladores/monitoreo.js";
import { showActivity } from "./controladores/actividad.js";
import { showProfile } from "./controladores/perfil.js";
import { showLayout } from "./controladores/menu.js";
import { session, preferences } from "./modelos/sesion.js";
import { el } from "./utilidades.js";

// public = sin sesión, adminOnly = solo administradores
const PAGINAS = {
  "inicio-sesion": { controller: showLogin,      public: true },
  "registro":      { controller: showRegister,   public: true },
  "verificacion":  { controller: showVerify,     public: true },
  "panel":         { controller: showDashboard,  adminOnly: true },
  "usuarios":      { controller: showUsers,      adminOnly: true },
  "monitoreo":     { controller: showMonitoring },
  "actividad":     { controller: showActivity,   adminOnly: true },
  "perfil":        { controller: showProfile },
};

const PAGINA_PUBLICA = "inicio-sesion";
const paginaPrivada = () => (session.isAdmin() ? "panel" : "monitoreo");

// a qué página debe ir el usuario según su sesión y su rol
function resolver(nombre) {
  const conSesion = session.isLoggedIn();
  const pagina = PAGINAS[nombre];
  if (!pagina) return conSesion ? paginaPrivada() : PAGINA_PUBLICA;
  if (!pagina.public && !conSesion) return PAGINA_PUBLICA;
  if (pagina.public && conSesion) return paginaPrivada();
  if (pagina.adminOnly && !session.isAdmin()) return paginaPrivada();
  return nombre;
}

function iniciar() {
  const actual = document.body.dataset.pagina;
  const destino = resolver(actual);
  if (destino !== actual) {
    location.replace(`${destino}.html`);
    return;
  }

  const root = document.getElementById("app");
  const pagina = PAGINAS[actual];
  let container;
  if (pagina.public) {
    container = el("div", { id: "auth-container" });
    root.replaceChildren(container);
  } else {
    const layout = showLayout(root);
    layout.setActive(`${actual}.html`);
    container = layout.content;
  }

  Promise.resolve(pagina.controller(container)).then((cleanup) => {
    if (typeof cleanup === "function") window.addEventListener("pagehide", cleanup);
  }).catch((error) => { console.error("Error en la pantalla:", error); });
}

document.documentElement.dataset.theme = preferences.getTheme();
iniciar();
