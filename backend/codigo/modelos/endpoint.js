// Modelo de los endpoints monitoreados (recurso /endpoints).
const db = require("../integraciones/cliente-bd");

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
    const { data } = await db.get("/endpoints");
    return data.map(Endpoint.fromRow);
  }

  static async findById(id) {
    return Endpoint.fromRow(await db.find(`/endpoints/${id}`));
  }

  static async count() {
    const { total } = await db.get("/endpoints/count");
    return Number(total);
  }

  static async create({ name, path, method, description }) {
    return Endpoint.fromRow(await db.post("/endpoints", { name, path, method, description }));
  }

  static async delete(id) {
    await db.delete(`/endpoints/${id}`);
  }
}

module.exports = Endpoint;
