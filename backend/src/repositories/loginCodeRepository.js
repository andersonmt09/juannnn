const { pool } = require("../config/database");
const LoginCodeModel = require("../models/loginCodeModel");

class LoginCodeRepository {
  async create({ userId, email, purpose, codeHash, expiresAt }) {
    const [result] = await pool.query(
      `INSERT INTO login_verification_codes (user_id, email, purpose, code_hash, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [userId || null, email, purpose, codeHash, expiresAt]
    );
    const [rows] = await pool.query("SELECT * FROM login_verification_codes WHERE id = ?", [result.insertId]);
    return LoginCodeModel.fromRow(rows[0]);
  }
  // Latest unused, unexpired code for email+purpose
  async findActive(email, purpose) {
    const [rows] = await pool.query(
      `SELECT * FROM login_verification_codes
       WHERE email = ? AND purpose = ? AND used = 0 AND expires_at > NOW()
       ORDER BY id DESC LIMIT 1`,
      [email, purpose]
    );
    return LoginCodeModel.fromRow(rows[0]);
  }
  async incrementAttempts(id) {
    await pool.query("UPDATE login_verification_codes SET attempts = attempts + 1 WHERE id = ?", [id]);
  }
  async markUsed(id) {
    await pool.query("UPDATE login_verification_codes SET used = 1 WHERE id = ?", [id]);
  }
  async invalidateAll(email, purpose) {
    await pool.query("UPDATE login_verification_codes SET used = 1 WHERE email = ? AND purpose = ?", [email, purpose]);
  }
}

module.exports = new LoginCodeRepository();
