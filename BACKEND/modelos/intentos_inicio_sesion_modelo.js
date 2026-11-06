// tabla intentos_inicio_sesion
const { db } = require("../config/base-datos");

class LoginAttempt {
  static async record({ userId = null, email, ipAddress, successful }) {
    await db.post("/login-attempts", { user_id: userId, email, ip_address: ipAddress || "desconocida", successful });
  }
}

module.exports = LoginAttempt;
