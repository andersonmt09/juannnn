// tabla codigos_verificacion
const { db } = require("../config/base-datos");
const codePurposes = require("./propositos_codigo_modelo");

class VerificationCode {
  constructor(row) {
    this.id = row.id;
    this.userId = row.user_id;
    this.email = row.email;
    this.purposeId = row.purpose_id;
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
      purpose_id: await codePurposes.idOf(purpose),
      code_hash: codeHash,
      expires_at: expiresAt.toISOString(),
    });
    return row.id;
  }

  static async findActive(email, purpose) {
    return VerificationCode.fromRow(await db.find("/verification-codes/active", { email, purpose_id: await codePurposes.idOf(purpose) }));
  }

  static async incrementAttempts(id) {
    const row = await db.post(`/verification-codes/${id}/attempts`);
    return Number(row?.attempts);
  }

  static async markUsed(id) {
    await db.patch(`/verification-codes/${id}`, { used: true });
  }

  static async invalidateAll(email, purpose) {
    await db.post("/verification-codes/invalidate", { email, purpose_id: await codePurposes.idOf(purpose) });
  }
}

module.exports = VerificationCode;
