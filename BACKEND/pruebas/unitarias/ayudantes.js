// Latido rápido para probar el SSE (debe fijarse antes de cargar los servicios)
process.env.SSE_HEARTBEAT_MS = "30";
const test = require("node:test");
const bcrypt = require("bcryptjs");
const User = require("../../modelos/usuarios_modelo");
const VerificationCode = require("../../modelos/codigos_verificacion_modelo");
const { mail } = require("../../config/correo");

// registros secundarios: en las unitarias no escriben en la base
const SECUNDARIOS = [
  ["auditoria_usuarios_modelo", "record"], ["intentos_inicio_sesion_modelo", "record"], ["correos_enviados_modelo", "record"], ["sesiones_modelo", "open"], ["sesiones_modelo", "revokeAll"],
  ["conexiones_en_vivo_modelo", "open"], ["conexiones_en_vivo_modelo", "close"], ["simulaciones_modelo", "record"], ["revisiones_servicio_modelo", "record"],
];
test.beforeEach(() => {
  for (const [modelo, metodo] of SECUNDARIOS) test.mock.method(require(`../../modelos/${modelo}`), metodo, async () => {});
});

const makeUser = (data) => new User({ email_verified: true, ...data });
const hash = (clave) => bcrypt.hashSync(clave, 4);
const admin = makeUser({ id: 1, name: "Admin", email: "admin@axon.com", role: "admin" });
const ana = makeUser({ id: 2, name: "Ana", email: "ana@axon.com", role: "user", password_hash: hash("actual1") });
const plainUser = { id: 1, name: "Ana", email: "a@b.com", passwordHash: "secreto", role: "user", emailVerified: true };

test.afterEach(() => test.mock.restoreAll());

// stub(Modelo, { metodo: valor | función }) devuelve los mocks por nombre de método
const stub = (obj, map) => Object.fromEntries(Object.entries(map).map(([k, v]) => [k, test.mock.method(obj, k, typeof v === "function" ? v : async () => v)]));
const usersById = (...users) => stub(User, { findById: async (id) => users.find((u) => u.id === id) || null });
const adminCount = (n) => stub(User, { countByRole: { admin: n, user: 3 } });
const mockCodes = () => ({
  ...stub(VerificationCode, { create: undefined, invalidateAll: undefined }),
  send: test.mock.method(mail, "sendVerificationCode", async () => {}),
});
const fakeStream = () => {
  const s = { writes: [], ended: false, write(c) { this.writes.push(c); }, end() { this.ended = true; } };
  s.closedWith = () => s.writes.map((w) => /event: stream:closed\ndata: (.*)\n/.exec(w)?.[1]).filter(Boolean).map((d) => JSON.parse(d).reason);
  return s;
};

module.exports = { makeUser, hash, admin, ana, plainUser, stub, usersById, adminCount, mockCodes, fakeStream };
