const test = require("node:test");
const assert = require("node:assert/strict");
// ayudantes fija SSE_HEARTBEAT_MS: debe cargarse antes que el servicio
const { makeUser, admin, fakeStream } = require("./ayudantes");
const eventService = require("../../rutas/eventos");
const authService = require("../../rutas/autenticacion");

const espera = () => new Promise((r) => setTimeout(r, 100));
const admin2 = (id) => makeUser({ id, role: "admin" });

test("publish escribe el evento SSE en cada cliente y unsubscribe lo retira", () => {
  const writes = [];
  const clientId = eventService.subscribe({ write: (c) => writes.push(c), end() {} }, admin);
  try {
    assert.equal(eventService.countClients(), 1);
    eventService.publish("api:activity", { method: "GET" });
    assert.equal(writes[0], 'event: api:activity\ndata: {"method":"GET"}\n\n');
    eventService.publishActivity({ method: "POST", path: "/api/x", statusCode: 201, latencyMs: 3, userId: 9 });
    const activity = JSON.parse(writes[1].split("data: ")[1]);
    assert.deepEqual(Object.keys(activity).sort(), ["createdAt", "id", "latencyMs", "method", "path", "statusCode"]);
  } finally {
    eventService.unsubscribe(clientId);
    eventService.closeAll();
  }
  assert.equal(eventService.countClients(), 0);
  eventService.publish("api:activity", {});
  assert.equal(writes.length, 2);
});

test("el 4.º stream del mismo usuario cierra el más viejo con too-many-streams", () => {
  eventService.closeAll();
  const streams = Array.from({ length: 4 }, fakeStream);
  try {
    streams.slice(0, 3).forEach((s) => eventService.subscribe(s, admin, "t"));
    eventService.subscribe(fakeStream(), admin2(77), "t");
    assert.equal(eventService.countClients(), 4);
    eventService.subscribe(streams[3], admin, "t");
    assert.deepEqual(streams[0].closedWith(), ["too-many-streams"]);
    assert.equal(streams[0].ended, true);
    assert.equal(streams[1].ended, false);
    assert.equal(eventService.countClients(), 4);
  } finally {
    eventService.closeAll();
  }
});

test("en cada latido se revalida el token y se cierra con session-invalid si falla o deja de ser admin", async () => {
  eventService.closeAll();
  let fallar = false;
  test.mock.method(authService, "authenticateToken", async (token) => {
    if (token === "malo" && fallar) throw Object.assign(new Error("expirado"), { statusCode: 401 });
    if (token === "bd-caida") throw Object.assign(new Error("BD no disponible"), { statusCode: 503 });
    return token === "degradado" ? makeUser({ id: 3, role: "user" }) : admin;
  });
  const [good, bad, demoted, dbDown] = Array.from({ length: 4 }, fakeStream);
  try {
    eventService.subscribe(good, admin, "bueno");
    eventService.subscribe(bad, admin2(8), "malo");
    eventService.subscribe(demoted, admin2(9), "degradado");
    eventService.subscribe(dbDown, admin2(10), "bd-caida");
    await espera();
    assert.deepEqual(demoted.closedWith(), ["session-invalid"]);
    assert.deepEqual(bad.closedWith(), []);
    fallar = true;
    await espera();
    assert.deepEqual(bad.closedWith(), ["session-invalid"]);
    assert.equal(bad.ended, true);
    assert.deepEqual(good.closedWith(), []);
    assert.deepEqual(dbDown.closedWith(), []);
    assert.equal(eventService.countClients(), 2);
  } finally {
    eventService.closeAll();
  }
});
