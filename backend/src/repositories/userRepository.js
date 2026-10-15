const { pool } = require("../config/database");
const UserModel = require("../models/userModel");

class UserRepository {
  async findByEmail(email) {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
    return UserModel.fromRow(rows[0]);
  }
  async findById(id) {
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ? LIMIT 1", [id]);
    return UserModel.fromRow(rows[0]);
  }
  async findAll({ includeInactive = false, page = 1, limit = 50 } = {}) {
    const where = includeInactive ? "" : "WHERE role != 'inactive'";
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(200, Math.max(1, Number(limit) || 50));
    const offset = (p - 1) * l;
    const [rows] = await pool.query(`SELECT * FROM users ${where} ORDER BY id ASC LIMIT ? OFFSET ?`, [l, offset]);
    const [total] = await pool.query(`SELECT COUNT(*) AS c FROM users ${where}`);
    return { data: rows.map((r) => UserModel.fromRow(r)), total: total[0].c, page: p, limit: l };
  }
  async create({ name, email, passwordHash, role = "user", createdBy = null, isSample = false, emailVerified = false }) {
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, email_verified, created_by_id, is_sample)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, email, passwordHash, role, emailVerified ? 1 : 0, createdBy, isSample ? 1 : 0]
    );
    return this.findById(result.insertId);
  }
  async update(id, { name, email, role }) {
    const fields = [];
    const params = [];
    if (name !== undefined) { fields.push("name = ?"); params.push(name); }
    if (email !== undefined) { fields.push("email = ?"); params.push(email); }
    if (role !== undefined) { fields.push("role = ?"); params.push(role); }
    if (!fields.length) return this.findById(id);
    params.push(id);
    await pool.query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, params);
    return this.findById(id);
  }
  async updatePassword(id, passwordHash) {
    await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [passwordHash, id]);
    return this.findById(id);
  }
  async setEmailVerified(email, value = 1) {
    await pool.query("UPDATE users SET email_verified = ? WHERE email = ?", [value ? 1 : 0, email]);
  }
  async softDelete(id) {
    await pool.query("UPDATE users SET role = 'inactive' WHERE id = ? AND role != 'inactive'", [id]);
    return this.findById(id);
  }
  async countByRole() {
    const [rows] = await pool.query("SELECT role, COUNT(*) AS c FROM users GROUP BY role");
    return rows;
  }
  async total() {
    const [rows] = await pool.query("SELECT COUNT(*) AS c FROM users");
    return rows[0].c;
  }
}

module.exports = new UserRepository();
