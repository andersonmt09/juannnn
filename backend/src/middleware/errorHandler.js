function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  const message = err.message || "Error interno del servidor";
  if (process.env.NODE_ENV !== "production") {
    console.error("[error]", err);
  }
  res.status(status).json({ ok: false, message, ...(err.errors ? { errors: err.errors } : {}) });
}

module.exports = errorHandler;
