// Modelo de los códigos de verificación enviados por correo (recurso /verification-codes).
const { db } = require("../externos");

class VerificationCode {
  constructor(row) {
    this.id = row.id;
    this.userId = row.user_id;
    this.email = row.email;
    this.purpose = row.purpose;
    this.codeHash = row.code_hash;
    this.expiresAt = row.expires_at;
    this.attempts = row.attempts;
    this.used = Boolean(row.used);
    this.createdAt = row.created_at;
  }

  static fromRow(row) { return row ? new VerificationCode(row) : null; }

  static async create({ userId, email, purpose, codeHash, expiresAt }) {
    const row = await db.post("/verification-codes", {
      user_id: userId,
      email,
      purpose,
      code_hash: codeHash,
      expires_at: expiresAt.toISOString(),
    });
    return row.id;
  }

  // Último código sin usar y sin vencer para un correo y propósito.
  static async findActive(email, purpose) {
    return VerificationCode.fromRow(await db.find("/verification-codes/active", { email, purpose }));
  }

  // Suma un intento y devuelve el total ya incrementado (la API externa lo hace de forma atómica).
  static async incrementAttempts(id) {
    const row = await db.post(`/verification-codes/${id}/attempts`);
    return Number(row?.attempts);
  }

  static async markUsed(id) {
    await db.patch(`/verification-codes/${id}`, { used: true });
  }

  // Invalida los códigos anteriores antes de generar uno nuevo.
  static async invalidateAll(email, purpose) {
    await db.post("/verification-codes/invalidate", { email, purpose });
  }
}

module.exports = VerificationCode;
