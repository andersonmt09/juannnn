// tabla usuarios
const bcrypt = require("bcryptjs");
const { db } = require("../config/base-datos");
const { ROLES } = require("../config/configuracion");
const roles = require("./roles_modelo");
const userStatuses = require("./estados_usuario_modelo");

// hash falso para comparar cuando el correo no existe
const DUMMY_HASH = "$2a$10$1MVaMj1bzwHmRn7aveW3S.Elz4Um5fPWL2DbSLq2VmxLCVplq9ika";

class User {
  constructor(row) {
    this.id = Number(row.id);
    this.name = row.name;
    this.email = row.email;
    this.passwordHash = row.password_hash;
    this.role = row.role;
    this.emailVerified = Boolean(row.email_verified);
    this.tokenVersion = Number(row.token_version) || 0;
    this.createdDate = row.created_date;
    this.updatedDate = row.updated_date;
  }

  isActive() { return this.role !== ROLES.INACTIVE; }
  isAdmin() { return this.role === ROLES.ADMIN; }

  async matchesPassword(password) {
    return Boolean(this.passwordHash) && bcrypt.compare(password, this.passwordHash);
  }

  // role: "admin", "user", o "inactive" si el estado es inactive
  static async fromRow(row) {
    if (!row) return null;
    const [role, status] = await Promise.all([roles.valueOf(row.role_id), userStatuses.valueOf(row.status_id)]);
    return new User({ ...row, role: status === "inactive" ? ROLES.INACTIVE : role });
  }

  static async findById(id) {
    return User.fromRow(await db.find(`/users/${id}`));
  }

  // busca también inactivos: el correo es único
  static async findByEmail(email) {
    const { data } = await db.get("/users", { email, includeInactive: true, limit: 1 });
    return User.fromRow(data[0]);
  }

  static async validateCredentials(email, password) {
    const user = await User.findByEmail(email);
    if (!user) {
      await bcrypt.compare(password, DUMMY_HASH);
      return null;
    }
    return (await user.matchesPassword(password)) ? user : null;
  }

  static async findPage({ page, limit }) {
    const { data, total } = await db.get("/users", { page, limit });
    return { users: await Promise.all(data.map(User.fromRow)), total };
  }

  static async countByRole() {
    return db.get("/users/count-by-role");
  }

  static async create({ name, email, passwordHash, role = ROLES.USER, emailVerified = false }) {
    const row = await db.post("/users", {
      name,
      email,
      password_hash: passwordHash,
      role_id: await roles.idOf(role),
      status_id: await userStatuses.idOf("active"),
      email_verified: emailVerified,
      token_version: 0,
    });
    return User.fromRow(row);
  }

  static async update(id, { name, email, role }) {
    const role_id = role ? await roles.idOf(role) : undefined;
    return User.fromRow(await db.patch(`/users/${id}`, { name, email, role_id }));
  }

  // tokenVersion nuevo cierra las demás sesiones
  static async updatePassword(id, passwordHash, tokenVersion) {
    await db.patch(`/users/${id}`, { password_hash: passwordHash, token_version: tokenVersion });
  }

  static async markEmailVerified(id) {
    await db.patch(`/users/${id}`, { email_verified: true });
  }

  // eliminación lógica: queda con estado inactive
  static async softDelete(id) {
    await db.patch(`/users/${id}`, { status_id: await userStatuses.idOf("inactive") });
  }
}

module.exports = User;
