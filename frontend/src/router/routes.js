/**
 * Tabla de rutas del frontend: ruta → vista.
 * public: se puede ver sin sesión.  adminOnly: solo administradores.
 */
import { renderLoginView } from "../views/auth/login.view.js";
import { renderRegisterView } from "../views/auth/register.view.js";
import { renderVerifyView } from "../views/auth/verify.view.js";
import { renderDashboardView } from "../views/dashboard/dashboard.view.js";
import { renderUsersView } from "../views/users/users.view.js";
import { renderEndpointsView } from "../views/endpoints/endpoints.view.js";
import { renderProfileView } from "../views/profile/profile.view.js";

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
