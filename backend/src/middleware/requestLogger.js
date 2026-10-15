const { pool } = require("../config/database");

function requestLogger(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const latency = Date.now() - start;
    const userId = req.user ? req.user.id : null;
    const sql = `INSERT INTO request_logs (method, path, status_code, latency_ms, source, user_id) VALUES (?, ?, ?, ?, ?, ?)`;
    pool
      .query(sql, [req.method, req.originalUrl, res.statusCode, latency, req.ip || null, userId])
      .catch((e) => console.error("[requestLogger]", e.message));
  });
  next();
}

module.exports = requestLogger;
