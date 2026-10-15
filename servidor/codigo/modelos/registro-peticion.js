// Modelo de la tabla request_logs (registro de cada petición a la API).
const { pool } = require("../configuracion/base-datos");

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
    await pool.query(
      `INSERT INTO request_logs (method, path, status_code, latency_ms, source, user_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [method, path, statusCode, latencyMs, source, userId]
    );
  }

  static async findRecent(limit = 10) {
    const [rows] = await pool.query("SELECT * FROM request_logs ORDER BY id DESC LIMIT ?", [limit]);
    return rows.map(RequestLog.fromRow);
  }

  static async getSummary() {
    const [[totals]] = await pool.query(
      `SELECT COUNT(*) AS total,
              SUM(created_at >= NOW() - INTERVAL 1 DAY) AS last24h,
              COALESCE(AVG(CASE WHEN created_at >= NOW() - INTERVAL 1 DAY THEN latency_ms END), 0) AS avgLatency
       FROM request_logs`
    );
    const [byStatus] = await pool.query(
      "SELECT status_code AS status, COUNT(*) AS total FROM request_logs GROUP BY status_code ORDER BY status_code"
    );
    const [byMethod] = await pool.query(
      "SELECT method, COUNT(*) AS total FROM request_logs GROUP BY method ORDER BY method"
    );
    return {
      total: Number(totals.total) || 0,
      last24h: Number(totals.last24h) || 0,
      avgLatencyMs: Math.round(Number(totals.avgLatency) || 0),
      byStatus: byStatus.map((r) => ({ status: r.status, count: Number(r.total) })),
      byMethod: byMethod.map((r) => ({ method: r.method, count: Number(r.total) })),
    };
  }
}

module.exports = RequestLog;
