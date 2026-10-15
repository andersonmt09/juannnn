// Modelo de la tabla endpoints.
const { pool } = require("../configuracion/base-datos");

class Endpoint {
  constructor(row) {
    this.id = row.id;
    this.name = row.name;
    this.path = row.path;
    this.method = row.method;
    this.description = row.description;
    this.createdAt = row.created_at;
  }

  static fromRow(row) { return row ? new Endpoint(row) : null; }

  static async findAll() {
    const [rows] = await pool.query("SELECT * FROM endpoints ORDER BY id DESC");
    return rows.map(Endpoint.fromRow);
  }

  static async findById(id) {
    const [rows] = await pool.query("SELECT * FROM endpoints WHERE id = ? LIMIT 1", [id]);
    return Endpoint.fromRow(rows[0]);
  }

  static async count() {
    const [[{ total }]] = await pool.query("SELECT COUNT(*) AS total FROM endpoints");
    return Number(total);
  }

  static async create({ name, path, method, description }) {
    const [result] = await pool.query(
      "INSERT INTO endpoints (name, path, method, description) VALUES (?, ?, ?, ?)",
      [name, path, method, description]
    );
    return Endpoint.findById(result.insertId);
  }

  static async delete(id) {
    await pool.query("DELETE FROM endpoints WHERE id = ?", [id]);
  }
}

module.exports = Endpoint;
