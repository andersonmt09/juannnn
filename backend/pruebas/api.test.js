// Pruebas de la API completa. Levantan servidor.js en un puerto libre,
// así que no hace falta tener el servidor encendido, pero sí backend/.env
// con la API de la base de datos externa disponible.
const test = require("node:test");
const assert = require("node:assert/strict");
const { validateEnvironment } = require("../configuracion");
const bcrypt = require("bcryptjs");

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

test("las rutas de detalle sin token devuelven 401", async () => {
  assert.equal((await request("GET", "/monitoring/endpoints/1")).status, 401);
  assert.equal((await request("GET", "/metrics/requests/1")).status, 401);
});

test("token_version: tras cambiar la contraseña el token y el refresh viejos devuelven 401", async () => {
  const User = require("../modelos/usuario");
  const { tokens } = require("../externos");
  const email = `tv-${Date.now()}@axon.com`;
  const user = await User.create({ name: "TV", email, passwordHash: await bcrypt.hash("clave123", 4), emailVerified: true });
  const old = tokens.issue(user);
  const auth = (t) => ({ Authorization: `Bearer ${t}` });
  const get = async (t) => (await fetch(`${baseUrl}/users/${user.id}`, { headers: auth(t) })).status;
  const refresh = async (t) =>
    (await fetch(`${baseUrl}/auth/refresh-token`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken: t }) })).status;

  assert.equal(await get(old.accessToken), 200);
  assert.equal(await refresh(old.refreshToken), 200);
  await User.updatePassword(user.id, await bcrypt.hash("otra1234", 4), 1);
  assert.equal(await get(old.accessToken), 401);
  assert.equal(await refresh(old.refreshToken), 401);
  await User.softDelete(user.id);
});

// ================= Grupo D: seguridad =================
// Los límites de autenticación se comparten dentro de este proceso (misma IP 127.0.0.1):
// las pruebas de validación usan POST /users (sin límite) y las de límites van al final y en orden.

const stamp = Date.now();
const created = []; // usuarios creados, para borrarlos al terminar

async function makeAccount(role, label) {
  const User = require("../modelos/usuario");
  const user = await User.create({ name: label, email: `${label}-${stamp}@axon.com`, passwordHash: await bcrypt.hash("clave1234", 4), role, emailVerified: true });
  created.push(user.id);
  const { tokens } = require("../externos");
  return { user, token: tokens.issue(user).accessToken };
}

async function authed(method, path, token, body) {
  const response = await fetch(baseUrl + path, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, data: await response.json().catch(() => null) };
}

test("POST /users valida: correo con coma, password objeto, rol Admin y contraseña de 7 o 73 caracteres → 400", async () => {
  const { token } = await makeAccount("admin", "val-admin");
  const base = { name: "Nuevo", email: `nuevo-${stamp}@axon.com`, password: "clave1234" };
  const cases = [
    [{ ...base, email: `a-${stamp}@axon.com,b@axon.com` }, /correo/i],
    [{ ...base, password: { $ne: "" } }, /contraseña/i],
    [{ ...base, role: "Admin" }, /El rol debe ser admin o user/],
    [{ ...base, password: "1234567" }, /contraseña/i],
    [{ ...base, password: "a".repeat(73) }, /contraseña/i],
  ];
  for (const [body, message] of cases) {
    const { status, data } = await authed("POST", "/users", token, body);
    assert.equal(status, 400, JSON.stringify(body));
    assert.match(data.message, message);
  }
  // Con 8 y con 72 caracteres sí se crea; el correo repetido da 409.
  const ok = await authed("POST", "/users", token, base);
  assert.equal(ok.status, 201);
  created.push(ok.data.data.id);
  assert.equal((await authed("POST", "/users", token, base)).status, 409);
  const long = await authed("POST", "/users", token, { ...base, email: `largo-${stamp}@axon.com`, password: "a".repeat(72) });
  assert.equal(long.status, 201);
  created.push(long.data.data.id);
});

test("usuario común: el detalle de un endpoint monitoreado no trae source; el admin sí", async () => {
  const admin = await makeAccount("admin", "src-admin");
  const common = await makeAccount("user", "src-user");
  const route = { name: `Prueba ${stamp}`, method: "GET", path: "/api/health" };
  const made = await authed("POST", "/monitoring/endpoints", admin.token, route);
  assert.equal(made.status, 201);
  const id = made.data.data.id;
  try {
    await request("GET", "/health"); // genera una petición registrada para esa ruta
    await new Promise((resolve) => setTimeout(resolve, 300)); // el registro se guarda sin bloquear la respuesta
    const asCommon = await authed("GET", `/monitoring/endpoints/${id}`, common.token);
    assert.equal(asCommon.status, 200);
    assert.ok(asCommon.data.data.recentRequests.length > 0);
    assert.ok(asCommon.data.data.recentRequests.every((r) => !("source" in r)));
    const asAdmin = await authed("GET", `/monitoring/endpoints/${id}`, admin.token);
    assert.ok(asAdmin.data.data.recentRequests.every((r) => "source" in r));
    // /api/events/stream no es una ruta monitoreable
    const routes = await authed("GET", "/monitoring/routes", admin.token);
    assert.ok(!routes.data.data.some((r) => r.path === "/api/events/stream"));
  } finally {
    await authed("DELETE", `/monitoring/endpoints/${id}`, admin.token);
  }
});

// Va después de las demás: agota los límites de autenticación de la IP de pruebas.
test("resend-code: enfriamiento de 30 s (segundo envío → 429) y máximo 5 por IP contando las exitosas", async () => {
  const emails = Array.from({ length: 6 }, (_, i) => `reenvio${i}-${stamp}@axon.com`);
  const resend = (email, path = "/auth/login/resend-code") => request("POST", path, { email });

  assert.equal((await resend(emails[0])).status, 200);
  const cooldown = await resend(emails[0]); // mismo correo, de inmediato
  assert.equal(cooldown.status, 429);
  assert.match(cooldown.data.message, /Espera unos segundos/);
  // También en el endpoint de registro (mismo correo y otro propósito no comparten enfriamiento, pero sí el límite por IP).
  assert.equal((await resend(emails[1])).status, 200);
  assert.equal((await resend(emails[2], "/auth/register/resend-code")).status, 200);
  assert.equal((await resend(emails[3])).status, 200); // 5.ª petición de la IP
  const limited = await resend(emails[4]);
  assert.equal(limited.status, 429);
  assert.match(limited.data.message, /Demasiados intentos/);
});

test("un X-Forwarded-For falso no evita el 429 del login (trust proxy desactivado)", async () => {
  const statuses = [];
  for (let i = 0; i < 8; i++) {
    const response = await fetch(baseUrl + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": `10.9.${i}.${i + 1}` },
      body: JSON.stringify({ email: `nadie${i}-${stamp}@axon.com`, password: "incorrecta1" }),
    });
    statuses.push(response.status);
  }
  const firstBlocked = statuses.indexOf(429);
  assert.ok(firstBlocked !== -1 && firstBlocked <= 5, `se esperaba 429 con máx. 5 intentos: ${statuses}`);
  assert.ok(statuses.slice(firstBlocked).every((s) => s === 429)); // cambiar la IP declarada no ayuda
});

test.after(async () => {
  const User = require("../modelos/usuario");
  for (const id of created) await User.softDelete(id).catch(() => {});
});
