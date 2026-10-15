// Rutas de la aplicación: ruta -> vista. public = sin sesión, adminOnly = solo administradores.
import { renderLoginView, renderRegisterView, renderVerifyView } from "../vistas/autenticacion.js";
import { renderDashboardView } from "../vistas/panel.js";
import { renderUsersView } from "../vistas/usuarios.js";
import { renderEndpointsView } from "../vistas/endpoints.js";
import { renderProfileView } from "../vistas/perfil.js";

export const ROUTES = {
  "#/login":     { view: renderLoginView,     public: true },
  "#/register":  { view: renderRegisterView,  public: true },
  "#/verify":    { view: renderVerifyView,    public: true },
  "#/dashboard": { view: renderDashboardView },
  "#/users":     { view: renderUsersView,     adminOnly: true },
  "#/endpoints": { view: renderEndpointsView },
  "#/profile":   { view: renderProfileView },
};

export const DEFAULT_PUBLIC_ROUTE = "#/login";
export const DEFAULT_PRIVATE_ROUTE = "#/dashboard";
