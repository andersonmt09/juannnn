// tabla rutas_vigiladas: rutas que el administrador sigue de cerca
const { db } = require("../config/base-datos");
const httpMethods = require("./metodos_http_modelo");

class MonitoredEndpoint {
  constructor(row) {
    this.id = Number(row.id);
    this.name = row.name;
    this.method = row.method;
    this.path = row.path;
    this.description = row.description;
    this.createdAt = row.created_at;
  }

  static async fromRow(row) {
    return row ? new MonitoredEndpoint({ ...row, method: await httpMethods.valueOf(row.method_id) }) : null;
  }

  static async findAll() {
    const { data } = await db.get("/endpoints", { limit: 100 });
    return Promise.all(data.map(MonitoredEndpoint.fromRow));
  }

  // path guarda el patrón de la ruta
  static async findByRoute(method, path) {
    const { data } = await db.get("/endpoints", { method_id: await httpMethods.idOf(method), path, limit: 1 });
    return MonitoredEndpoint.fromRow(data[0]);
  }

  static async findById(id) {
    return MonitoredEndpoint.fromRow(await db.find(`/endpoints/${id}`));
  }

  static async create({ name, method, path, description }) {
    return MonitoredEndpoint.fromRow(await db.post("/endpoints", { method_id: await httpMethods.idOf(method), name, path, description }));
  }

  static async delete(id) {
    await db.delete(`/endpoints/${id}`);
  }
}

module.exports = MonitoredEndpoint;
