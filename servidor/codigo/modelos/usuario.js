// Modelo de la tabla users.
const { pool } = require("../configuracion/base-datos");
const { ROLES } = require("../constantes/roles");

class User {
  constructor(row) {
    this.id = row.id;
    this.name = row.name;
    this.email = row.email;
    this.passwordHash = row.password_hash;
    this.role = row.role;
    this.emailVerified = Boolean(row.email_verified);
    this.isSample = Boolean(row.is_sample);
    this.createdById = row.created_by_id;
    this.createdDate = row.created_date;
    this.updatedDate = row.updated_date;
  }

  isActive() { return this.role !== ROLES.INACTIVE; }
  isAdmin() { return this.role === ROLES.ADMIN; }

  static fromRow(row) { return row ? new User(row) : null; }

  // Consultas

  static async findById(id) {
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ? LIMIT 1", [id]);
    return User.fromRow(rows[0]);
  }

  static async findByEmail(email) {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
    return User.fromRow(rows[0]);
  }

  static async findAll({ includeInactive = false, page = 1, limit = 50 } = {}) {
    const where = includeInactive ? "" : "WHERE role <> 'inactive'";
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      `SELECT * FROM users ${where} ORDER BY id ASC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM users ${where}`);
    return { users: rows.map(User.fromRow), total };
  }

  static async countByRole() {
    const [rows] = await pool.query("SELECT role, COUNT(*) AS total FROM users GROUP BY role");
    return rows.reduce((acc, row) => ({ ...acc, [row.role]: Number(row.total) }), {});
  }

  // Escritura

  static async create({ name, email, passwordHash, role = ROLES.USER, emailVerified = false, createdById = null }) {
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, email_verified, created_by_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, passwordHash, role, emailVerified ? 1 : 0, createdById]
    );
    return User.findById(result.insertId);
  }

  static async update(id, { name, email, role }) {
    const fields = [];
    const values = [];
    if (name !== undefined) { fields.push("name = ?"); values.push(name); }
    if (email !== undefined) { fields.push("email = ?"); values.push(email); }
    if (role !== undefined) { fields.push("role = ?"); values.push(role); }
    if (fields.length) {
      await pool.query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, [...values, id]);
    }
    return User.findById(id);
  }

  static async updatePassword(id, passwordHash) {
    await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [passwordHash, id]);
  }

  static async markEmailVerified(email) {
    await pool.query("UPDATE users SET email_verified = 1 WHERE email = ?", [email]);
  }

  // Eliminación lógica: el registro se conserva con rol 'inactive'.
  static async softDelete(id) {
    await pool.query("UPDATE users SET role = 'inactive' WHERE id = ?", [id]);
  }
}

module.exports = User;
