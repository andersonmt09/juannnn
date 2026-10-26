// Pruebas de la API completa. Levantan aplicacion.js en un puerto libre,
// así que no hace falta tener el servidor encendido, pero sí backend/.env
// con la API de la base de datos externa disponible.
const test = require("node:test");
const assert = require("node:assert/strict");
const { validateEnvironment } = require("../configuracion");

validateEnvironment();
const app = require("../servidor");

let server;
let baseUrl;

test.before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

async function request(method, path, body) {
  const response = await fetch(baseUrl + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, data: await response.json().catch(() => null) };
}

test("GET /health responde y la base de datos está conectada", async () => {
  const { status, data } = await request("GET", "/health");
  assert.equal(status, 200);
  assert.equal(data.database, "ok");
});

test("una ruta protegida sin token devuelve 401", async () => {
  const { status } = await request("GET", "/users");
  assert.equal(status, 401);
});

test("login con datos inválidos devuelve 400", async () => {
  const { status } = await request("POST", "/auth/login", { email: "no-es-correo", password: "" });
  assert.equal(status, 400);
});

test("login con credenciales incorrectas devuelve 401", async () => {
  const { status } = await request("POST", "/auth/login", { email: "nadie@axon.com", password: "incorrecta" });
  assert.equal(status, 401);
});

test("una ruta inexistente devuelve 404", async () => {
  const { status } = await request("GET", "/no-existe");
  assert.equal(status, 404);
});

test("el frontend se sirve desde el mismo servidor", async () => {
  const response = await fetch(baseUrl.replace(/\/api$/, "/"));
  assert.equal(response.status, 200);
  assert.match(await response.text(), /<html/i);
});
