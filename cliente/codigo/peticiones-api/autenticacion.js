// Llamadas a /api/auth
import { http } from "./cliente-http.js";

export const authApi = {
  register: (data) => http.post("/auth/register", data),
  verifyRegistration: (email, code) => http.post("/auth/register/verify", { email, code }),
  resendRegistrationCode: (email) => http.post("/auth/register/resend-code", { email }),

  login: (email, password) => http.post("/auth/login", { email, password }),
  verifyLogin: (email, code) => http.post("/auth/login/verify", { email, code }),
  resendLoginCode: (email) => http.post("/auth/login/resend-code", { email }),
};
