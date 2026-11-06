// tabla auditoria_usuarios: quién creó, editó o eliminó cuentas
const { db } = require("../config/base-datos");

class UserAudit {
  static async record({ userId, action, targetEmail, detail = null }) {
    await db.post("/user-audit", { user_id: userId, action, target_email: targetEmail, detail });
  }
}

module.exports = UserAudit;
