// Pruebas contra la API en ejecución (npm start en otra terminal).
// Otra URL: BASE_URL=http://host:puerto/api npm run test:integration
const test = require("node:test");
const assert = require("node:assert/strict");

const BASE_URL = process.env.BASE_URL || "http://localhost:4000/api";

async function request(method, path, body, token) {
  const response = await fetch(BASE_URL + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, data: await response.json().catch(() => null) };
}

test("GET /health responde y la BD está conectada", async () => {
  const { status, data } = await request("GET", "/health");
  assert.equal(status, 200);
  assert.equal(data.database, "ok");
});

test("ruta protegida sin token devuelve 401", async () => {
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

test("ruta inexistente devuelve 404", async () => {
  const { status } = await request("GET", "/no-existe");
  assert.equal(status, 404);
});
