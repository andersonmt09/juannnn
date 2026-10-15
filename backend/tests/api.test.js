const test = require("node:test");
const assert = require("node:assert/strict");

const BASE = process.env.BASE_URL || "http://localhost:4000/api";

async function j(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = "Bearer " + token;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch (e) {}
  return { status: res.status, data };
}

test("health endpoint", async () => {
  const r = await j("GET", "/health");
  assert.equal(r.status, 200);
  assert.equal(r.data.ok, true);
});

test("login con credenciales inválidas devuelve 401", async () => {
  const r = await j("POST", "/auth/login", { email: "admin@axon.com", password: "wrong" });
  assert.equal(r.status, 401);
});

test("ruta protegida sin token devuelve 401", async () => {
  const r = await j("GET", "/users");
  assert.equal(r.status, 401);
});

test("login válido solicita verificación", async () => {
  const r = await j("POST", "/auth/login", { email: "admin@axon.com", password: "Admin123!" });
  assert.equal(r.status, 200);
  assert.equal(r.data.requiresVerification, true);
});