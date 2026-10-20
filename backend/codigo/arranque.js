// Arranque: valida el .env, comprueba la conexión a la base de datos e inicia el servidor.
const { env, validateEnvironment } = require("./configuracion/entorno");

validateEnvironment();

const app = require("./aplicacion");
const { testConnection, closeConnection } = require("./base-datos/conexion");

async function start() {
  try {
    await testConnection();
    console.log(`[db] Conectado a la base de datos externa (${env.database.host}:${env.database.port})`);
  } catch (error) {
    console.error("[db] No se pudo conectar a la base de datos:", error.message);
    console.error("     Revisa DB_HOST, DB_USER, DB_PASSWORD y DB_NAME en backend/.env");
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    console.log(`[backend] API escuchando en http://localhost:${env.port}/api`);
  });

  const shutdown = (signal) => {
    console.log(`\n[backend] ${signal} recibido. Cerrando...`);
    server.close(async () => {
      await closeConnection().catch(() => {});
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start();
