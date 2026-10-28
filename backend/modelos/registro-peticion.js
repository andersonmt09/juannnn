// route es el patrón de la ruta (/api/users/:id)
const { db } = require("../externos");

class RequestLog {
  constructor(row) {
    this.id = Number(row.id);
    this.method = row.method;
    this.path = row.path;
    this.route = row.route;
    this.statusCode = row.status_code;
    this.latencyMs = row.latency_ms;
    this.source = row.source;
    this.userId = row.user_id == null ? null : Number(row.user_id);
    this.createdAt = row.created_at;
  }

  static fromRow(row) { return row ? new RequestLog(row) : null; }

  static async create({ method, path, route, statusCode, latencyMs, source, userId }) {
    const row = await db.post("/request-logs", {
      method,
      path,
      route,
      status_code: statusCode,
      latency_ms: latencyMs,
      source,
      user_id: userId,
    });
    return row?.id ?? null;
  }

  static async findById(id) {
    return RequestLog.fromRow(await db.find(`/request-logs/${id}`));
  }

  static async findRecent(limit = 10) {
    const { data } = await db.get("/request-logs", { limit });
    return data.map(RequestLog.fromRow);
  }

  static async findPage({ page = 1, limit = 20, method, statusClass, route } = {}) {
    const { data, total } = await db.get("/request-logs", { page, limit, method, statusClass, route });
    return { logs: data.map(RequestLog.fromRow), total: Number(total) || 0 };
  }

  static async getSummary() {
    const summary = await db.get("/request-logs/summary");
    return {
      total: Number(summary.total) || 0,
      last24h: Number(summary.last24h) || 0,
      avgLatencyMs: Math.round(Number(summary.avgLatencyMs) || 0),
      byStatus: summary.byStatus || [],
      byMethod: summary.byMethod || [],
    };
  }

  static async getStatsByRoute() {
    const { data } = await db.get("/request-logs/stats-by-route");
    return data.map((row) => ({
      method: row.method,
      route: row.route,
      total: Number(row.total) || 0,
      errors: Number(row.errors) || 0,
      avgLatencyMs: Math.round(Number(row.avgLatencyMs) || 0),
      lastRequestAt: row.lastRequestAt || null,
    }));
  }
}

module.exports = RequestLog;
