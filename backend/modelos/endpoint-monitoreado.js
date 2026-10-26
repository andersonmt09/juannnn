// Modelo de un endpoint de la API que el administrador eligió monitorear (recurso /endpoints).
const { db } = require("../externos");

class MonitoredEndpoint {
  constructor(row) {
    this.id = row.id;
    this.name = row.name;
    this.method = row.method;
    this.path = row.path;
    this.description = row.description;
    this.createdAt = row.created_at;
  }

  static fromRow(row) { return row ? new MonitoredEndpoint(row) : null; }

  static async findAll() {
    const { data } = await db.get("/endpoints");
    return data.map(MonitoredEndpoint.fromRow);
  }

  static async findById(id) {
    return MonitoredEndpoint.fromRow(await db.find(`/endpoints/${id}`));
  }

  static async create({ name, method, path, description }) {
    return MonitoredEndpoint.fromRow(await db.post("/endpoints", { name, method, path, description }));
  }

  static async delete(id) {
    await db.delete(`/endpoints/${id}`);
  }
}

module.exports = MonitoredEndpoint;
