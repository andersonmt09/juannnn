const { pool } = require("../config/database");
const EndpointModel = require("../models/endpointModel");

class EndpointRepository {
  async findAll() {
    const [rows] = await pool.query("SELECT * FROM endpoints ORDER BY id DESC");
    return rows.map((r) => EndpointModel.fromRow(r));
  }
  async findById(id) {
    const [rows] = await pool.query("SELECT * FROM endpoints WHERE id = ? LIMIT 1", [id]);
    return EndpointModel.fromRow(rows[0]);
  }
  async create({ name, path, method, description }) {
    const [result] = await pool.query(
      `INSERT INTO endpoints (name, path, method, description) VALUES (?, ?, ?, ?)`,
      [name, path, method, description || null]
    );
    return this.findById(result.insertId);
  }
  async delete(id) {
    await pool.query("DELETE FROM endpoints WHERE id = ?", [id]);
    return true;
  }
}

module.exports = new EndpointRepository();
