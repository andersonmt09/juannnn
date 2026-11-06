const test = require("node:test");
const assert = require("node:assert/strict");
const User = require("../../modelos/usuarios_modelo");
const VerificationCode = require("../../modelos/codigos_verificacion_modelo");
const authService = require("../../rutas/autenticacion");
const userService = require("../../rutas/usuarios");
const { tokens } = require("../../config/seguridad");
const { makeUser, hash, ana, stub, mockCodes } = require("./ayudantes");

const MSG_CODIGO = "Código inválido o expirado";
const verificar = (email = "a@b.com", code = "111111") => authService.verifyLogin({ email, code });

test("generateCode produce 6 dígitos", () => {
  for (let i = 0; i < 50; i++) assert.match(authService.generateCode(), /^\d{6}$/);
});

test("validateCredentials: 401 si falla, 403 si está inactivo, 403 EMAIL_NOT_VERIFIED, y éxito", async () => {
  const casos = [
    [null, { statusCode: 401 }],
    [makeUser({ id: 3, role: "inactive" }), { statusCode: 403 }],
    [makeUser({ id: 3, role: "user", email_verified: false }), { statusCode: 403, code: "EMAIL_NOT_VERIFIED" }],
  ];
  for (const [resultado, error] of casos) {
    stub(User, { validateCredentials: resultado });
    await assert.rejects(authService.validateCredentials({ email: "a@b.com", password: "x" }), error);
    test.mock.restoreAll();
  }
  stub(User, { validateCredentials: ana });
  assert.equal((await authService.validateCredentials({ email: "a@b.com", password: "x" })).id, 2);
});

test("startLoginVerification emite un código de propósito login", async () => {
  const { create, send } = mockCodes();
  assert.deepEqual(await authService.startLoginVerification(ana), { email: "ana@axon.com" });
  assert.equal(create.mock.calls[0].arguments[0].purpose, "login");
  assert.equal(send.mock.calls[0].arguments[2], "login");
});

test("token de acceso: versión vieja da 401; versión actual sirve", async () => {
  const current = makeUser({ id: 2, role: "user", token_version: 1 });
  stub(User, { findById: current });
  const old = tokens.issue(makeUser({ id: 2, role: "user", token_version: 0 }));
  await assert.rejects(authService.authenticateToken(old.accessToken), { statusCode: 401, message: /ya no es válida/ });
  assert.equal((await authService.authenticateToken(tokens.issue(current).accessToken)).id, 2);
});

test("changePassword propio devuelve sesión nueva y la vieja deja de servir", async () => {
  let stored = makeUser({ id: 2, role: "user", token_version: 0, password_hash: hash("actual1") });
  const oldSession = tokens.issue(stored);
  stub(User, {
    findById: async () => stored,
    updatePassword: async (id, passwordHash, version) => { stored = makeUser({ id, role: "user", token_version: version, password_hash: passwordHash }); },
  });
  const session = await userService.changePassword(2, { currentPassword: "actual1", password: "nueva12" }, stored);
  assert.ok(session.accessToken && session.refreshToken);
  assert.equal((await authService.authenticateToken(session.accessToken)).id, 2);
  await assert.rejects(authService.authenticateToken(oldSession.accessToken), { statusCode: 401 });
  await assert.rejects(authService.refreshSession({ refreshToken: oldSession.refreshToken }), { statusCode: 401 });
});

test("10 verificaciones en paralelo con código malo no pasan de 5 comparaciones", async () => {
  let counter = 0;
  const m = stub(VerificationCode, {
    findActive: { id: 1, attempts: 0, codeHash: hash("123456") },
    incrementAttempts: async () => ++counter,
    markUsed: undefined,
  });
  stub(User, { findByEmail: ana });
  const results = await Promise.allSettled(Array.from({ length: 10 }, () => verificar("ana@axon.com", "000000")));
  const codes = results.map((r) => r.reason.statusCode);
  assert.equal(m.incrementAttempts.mock.callCount(), 10);
  assert.equal(codes.filter((c) => c === 401).length, 5);
  assert.equal(codes.filter((c) => c === 429).length, 5);
  assert.equal(m.markUsed.mock.callCount(), 0);
  assert.equal(results[0].reason.message, MSG_CODIGO);
});

test("código inexistente e incorrecto dan el mismo mensaje", async () => {
  const { findActive } = stub(VerificationCode, { findActive: null });
  await assert.rejects(verificar(), { statusCode: 401, message: MSG_CODIGO });
  findActive.mock.restore();
  stub(VerificationCode, { findActive: { id: 1, codeHash: hash("123456") }, incrementAttempts: 1 });
  await assert.rejects(verificar(), { statusCode: 401, message: MSG_CODIGO });
});

test("resendCode: el segundo envío inmediato al mismo correo da 429", async () => {
  mockCodes();
  stub(User, { findByEmail: ana });
  const datos = { email: `cool-${Date.now()}@axon.com`, purpose: "login" };
  await authService.resendCode(datos);
  await assert.rejects(authService.resendCode(datos), { statusCode: 429, message: /Espera unos segundos/ });
});

test("cada intento de login se registra (fallido o correcto) y cada código enviado queda en sent_emails", async () => {
  const LoginAttempt = require("../../modelos/intentos_inicio_sesion_modelo");
  const SentEmail = require("../../modelos/correos_enviados_modelo");
  const datos = { email: "a@b.com", password: "x" };
  const flush = () => new Promise((resolve) => setImmediate(resolve));
  // clave mala con correo existente: el intento guarda el usuario pero no es exitoso
  stub(User, { validateCredentials: null, findByEmail: ana });
  await assert.rejects(authService.validateCredentials(datos, { ipAddress: "1.1.1.1" }), { statusCode: 401 });
  await flush();
  stub(User, { validateCredentials: ana });
  await authService.validateCredentials(datos, { ipAddress: "1.1.1.1" });
  await flush();
  assert.equal(LoginAttempt.record.mock.calls[0].arguments[0].userId, 2);
  assert.deepEqual(LoginAttempt.record.mock.calls.map((c) => c.arguments[0].successful), [false, true]);
  assert.equal(LoginAttempt.record.mock.calls[1].arguments[0].userId, 2);

  mockCodes();
  stub(VerificationCode, { create: 7 });
  await authService.startLoginVerification(ana);
  await flush();
  assert.equal(SentEmail.record.mock.calls[0].arguments[0].codeId, 7);
});
