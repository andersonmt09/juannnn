require("dotenv").config();
const { validateEnv } = require("./config/validateEnv");
validateEnv();

const http = require("http");
const app = require("./app");
const { testConnection, pool } = require("./config/database");
const { initSocket } = require("./socket/socket");

const PORT = Number(process.env.PORT) || 4000;

(async () => {
  try {
    await testConnection();
    console.log("[db] Conexión MySQL OK");
  } catch (e) {
    console.error("[db] No se pudo conectar a MySQL:", e.message);
    console.error("      Verifique .env y que MySQL esté corriendo.");
    process.exit(1);
  }

  const server = http.createServer(app);
  const io = initSocket(server);
  app.set("io", io);

  const shutdown = async (signal) => {
    console.log(`\n[server] Señal ${signal} recibida. Cerrando...`);
    server.close(async () => {
      try { await pool.end(); } catch (e) {}
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  server.listen(PORT, () => console.log(`[server] AXON backend escuchando en http://localhost:${PORT}`));
})();