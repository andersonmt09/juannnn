// Arranque: valida el .env, comprueba que la API de la base de datos responde e inicia el servidor.
const { env, validateEnvironment } = require("./configuracion/entorno");

validateEnvironment();

const app = require("./aplicacion");
const healthService = require("./servicios/salud");

async function start() {
  const { databaseAvailable } = await healthService.check();
  if (!databaseAvailable) {
    console.error(`[bd] No se pudo contactar la API de la base de datos (${env.databaseApi.url})`);
    console.error("     Revisa DATABASE_API_URL y DATABASE_API_KEY en backend/.env");
    process.exit(1);
  }
  console.log(`[bd] API de la base de datos disponible (${env.databaseApi.url})`);

  const server = app.listen(env.port, () => {
    console.log(`[axon] Aplicación en http://localhost:${env.port}  ·  API en http://localhost:${env.port}/api`);
  });

  const shutdown = (signal) => {
    console.log(`\n[axon] ${signal} recibido. Cerrando...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start();
