// Pruebas de la API completa. Levantan servidor.js en un puerto libre,
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
  assert.equal(data.status, "online");
  assert.equal(data.database, "connected");
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

test("una ruta inexistente devuelve 404 con mensaje y ruta sin query", async () => {
  const { status, data } = await request("GET", "/no-existe?x=1");
  assert.equal(status, 404);
  assert.equal(data.ok, false);
  assert.equal(data.message, "Endpoint no encontrado");
  assert.equal(data.path, "/api/no-existe");
  assert.equal(data.method, "GET");
});

test("un JSON mal formado devuelve 400 en español", async () => {
  const response = await fetch(baseUrl + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{bad",
  });
  const data = await response.json();
  assert.equal(response.status, 400);
  assert.equal(data.message, "El cuerpo de la petición no es un JSON válido");
});

test("las rutas de administración sin token devuelven 401", async () => {
  for (const [method, path] of [
    ["POST", "/simulations"],
    ["POST", "/axonApi"],
    ["GET", "/metrics/services"],
    ["GET", "/metrics/requests"],
    ["GET", "/metrics/dashboard"],
    ["POST", "/events/ping"],
  ]) {
    const { status } = await request(method, path);
    assert.equal(status, 401, `${method} ${path}`);
  }
});

test("el stream de eventos sin token o con token inválido devuelve 401", async () => {
  assert.equal((await request("GET", "/events/stream")).status, 401);
  assert.equal((await request("GET", "/events/stream?token=falso")).status, 401);
});

test("un archivo estático inexistente devuelve 404 y una ruta del SPA devuelve el HTML", async () => {
  const root = baseUrl.replace(/\/api$/, "");
  assert.equal((await fetch(root + "/css/nada.css")).status, 404);
  const spa = await fetch(root + "/users");
  assert.equal(spa.status, 200);
  assert.match(await spa.text(), /<html/i);
});

test("el frontend se sirve desde el mismo servidor", async () => {
  const response = await fetch(baseUrl.replace(/\/api$/, "/"));
  assert.equal(response.status, 200);
  assert.match(await response.text(), /<html/i);
});
