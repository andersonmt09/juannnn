// Arranque: valida el .env, comprueba que la API de la base de datos responde e inicia el servidor.
const { env, validateEnvironment } = require("./configuracion/entorno");

validateEnvironment();

const app = require("./aplicacion");
const db = require("./integraciones/cliente-bd");

async function start() {
  try {
    await db.ping();
    console.log(`[bd] API de la base de datos disponible (${env.databaseApi.url})`);
  } catch (error) {
    console.error("[bd] No se pudo contactar la API de la base de datos:", error.message);
    console.error("     Revisa DATABASE_API_URL y DATABASE_API_KEY en backend/.env");
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    console.log(`[backend] API escuchando en http://localhost:${env.port}/api`);
  });

  const shutdown = (signal) => {
    console.log(`\n[backend] ${signal} recibido. Cerrando...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start();
