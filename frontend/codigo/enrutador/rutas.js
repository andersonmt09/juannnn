// Rutas de la aplicación: ruta -> controlador. public = sin sesión, adminOnly = solo administradores.
import { showLogin } from "../controladores/inicio-sesion.js";
import { showRegister } from "../controladores/registro.js";
import { showVerify } from "../controladores/verificacion.js";
import { showDashboard } from "../controladores/panel.js";
import { showUsers } from "../controladores/usuarios.js";
import { showEndpoints } from "../controladores/endpoints.js";
import { showProfile } from "../controladores/perfil.js";

export const ROUTES = {
  "#/login":     { controller: showLogin,     public: true },
  "#/register":  { controller: showRegister,  public: true },
  "#/verify":    { controller: showVerify,    public: true },
  "#/dashboard": { controller: showDashboard },
  "#/users":     { controller: showUsers,     adminOnly: true },
  "#/endpoints": { controller: showEndpoints },
  "#/profile":   { controller: showProfile },
};

export const DEFAULT_PUBLIC_ROUTE = "#/login";
export const DEFAULT_PRIVATE_ROUTE = "#/dashboard";
