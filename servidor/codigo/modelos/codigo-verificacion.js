// Modelo de la tabla login_verification_codes (códigos enviados por correo).
const { pool } = require("../configuracion/base-datos");

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
    const [result] = await pool.query(
      `INSERT INTO login_verification_codes (user_id, email, purpose, code_hash, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, email, purpose, codeHash, expiresAt]
    );
    return result.insertId;
  }

  // Último código sin usar y sin expirar para un correo y propósito.
  static async findActive(email, purpose) {
    const [rows] = await pool.query(
      `SELECT * FROM login_verification_codes
       WHERE email = ? AND purpose = ? AND used = 0 AND expires_at > UTC_TIMESTAMP()
       ORDER BY id DESC LIMIT 1`,
      [email, purpose]
    );
    return VerificationCode.fromRow(rows[0]);
  }

  static async incrementAttempts(id) {
    await pool.query("UPDATE login_verification_codes SET attempts = attempts + 1 WHERE id = ?", [id]);
  }

  static async markUsed(id) {
    await pool.query("UPDATE login_verification_codes SET used = 1 WHERE id = ?", [id]);
  }

  // Invalida los códigos anteriores antes de generar uno nuevo.
  static async invalidateAll(email, purpose) {
    await pool.query(
      "UPDATE login_verification_codes SET used = 1 WHERE email = ? AND purpose = ? AND used = 0",
      [email, purpose]
    );
  }
}

module.exports = VerificationCode;
