/** SERVICIO: llamadas a /api/auth. */
import { http } from "./http.client.js";
import { session } from "./session.service.js";

export const authService = {
  register: (data) => http.post("/auth/register", data),                                  // RF-01
  verifyRegistration: (email, code) => http.post("/auth/register/verify", { email, code }), // RF-02
  resendRegistrationCode: (email) => http.post("/auth/register/resend-code", { email }),    // RF-04
  login: (email, password) => http.post("/auth/login", { email, password }),               // RF-03
  resendLoginCode: (email) => http.post("/auth/login/resend-code", { email }),              // RF-04

  /** RF-03 paso 2: valida el código y guarda la sesión. */
  async verifyLogin(email, code) {
    const result = await http.post("/auth/login/verify", { email, code });
    session.save(result);
    return result.user;
  },

  /** RF-16: cierra la sesión. */
  logout() {
    session.clear();
    location.hash = "#/login";
  },
};
