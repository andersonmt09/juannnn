// Modelo del registro de peticiones a la API (recurso /request-logs).
const db = require("../base-datos/cliente-bd");

class RequestLog {
  constructor(row) {
    this.id = row.id;
    this.method = row.method;
    this.path = row.path;
    this.statusCode = row.status_code;
    this.latencyMs = row.latency_ms;
    this.source = row.source;
    this.userId = row.user_id;
    this.createdAt = row.created_at;
  }

  static fromRow(row) { return row ? new RequestLog(row) : null; }

  static async create({ method, path, statusCode, latencyMs, source, userId }) {
    await db.post("/request-logs", {
      method,
      path,
      status_code: statusCode,
      latency_ms: latencyMs,
      source,
      user_id: userId,
    });
  }

  static async findRecent(limit = 10) {
    const { data } = await db.get("/request-logs", { limit });
    return data.map(RequestLog.fromRow);
  }

  // Totales, últimas 24 horas, latencia promedio y conteos por código y método.
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
}

module.exports = RequestLog;
