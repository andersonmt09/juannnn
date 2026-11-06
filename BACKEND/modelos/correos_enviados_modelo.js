// tabla correos_enviados
const { db } = require("../config/base-datos");

class SentEmail {
  static async record({ codeId, recipient, subject }) {
    await db.post("/sent-emails", { code_id: codeId, recipient, subject });
  }
}

module.exports = SentEmail;
