const { pool } = require("../config/database");
const LogModel = require("../models/logModel");

class LogRepository {
  async recent(limit = 20) {
    const [rows] = await pool.query(
      "SELECT * FROM request_logs ORDER BY id DESC LIMIT ?",
      [limit]
    );
    return rows.map((r) => LogModel.fromRow(r));
  }
  async summary() {
    const [total] = await pool.query("SELECT COUNT(*) AS c FROM request_logs");
    const [last24] = await pool.query("SELECT COUNT(*) AS c FROM request_logs WHERE created_at >= (NOW() - INTERVAL 1 DAY)");
    const [avgLat] = await pool.query("SELECT COALESCE(AVG(latency_ms),0) AS a FROM request_logs WHERE created_at >= (NOW() - INTERVAL 1 DAY)");
    const [byStatus] = await pool.query("SELECT status_code, COUNT(*) AS c FROM request_logs GROUP BY status_code ORDER BY status_code");
    const [byMethod] = await pool.query("SELECT method, COUNT(*) AS c FROM request_logs GROUP BY method");
    return {
      total: total[0].c,
      last24h: last24[0].c,
      avgLatencyMs: Math.round(Number(avgLat[0].a) || 0),
      byStatus: byStatus.map((r) => ({ status: r.status_code, count: r.c })),
      byMethod: byMethod.map((r) => ({ method: r.method, count: r.c })),
    };
  }
}

module.exports = new LogRepository();
