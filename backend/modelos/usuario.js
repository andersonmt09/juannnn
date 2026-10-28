const bcrypt = require("bcryptjs");
const { db } = require("../externos");
const { ROLES } = require("../configuracion");

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
    this.createdById = row.created_by_id == null ? null : Number(row.created_by_id);
    this.tokenVersion = Number(row.token_version) || 0;
    this.createdDate = row.created_date;
    this.updatedDate = row.updated_date;
  }

  isActive() { return this.role !== ROLES.INACTIVE; }
  isAdmin() { return this.role === ROLES.ADMIN; }

  async matchesPassword(password) {
    return Boolean(this.passwordHash) && bcrypt.compare(password, this.passwordHash);
  }

  static fromRow(row) { return row ? new User(row) : null; }

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
    return { users: data.map(User.fromRow), total };
  }

  static async countByRole() {
    return db.get("/users/count-by-role");
  }

  static async create({ name, email, passwordHash, role = ROLES.USER, emailVerified = false, createdById = null }) {
    const row = await db.post("/users", {
      name,
      email,
      password_hash: passwordHash,
      role,
      email_verified: emailVerified,
      created_by_id: createdById,
    });
    return User.fromRow(row);
  }

  static async update(id, { name, email, role }) {
    return User.fromRow(await db.patch(`/users/${id}`, { name, email, role }));
  }

  // si llega tokenVersion se cierran las demás sesiones
  static async updatePassword(id, passwordHash, tokenVersion) {
    const changes = { password_hash: passwordHash };
    if (tokenVersion !== undefined) changes.token_version = tokenVersion;
    await db.patch(`/users/${id}`, changes);
  }

  static async markEmailVerified(id) {
    await db.patch(`/users/${id}`, { email_verified: true });
  }

  // eliminación lógica: queda con rol inactive
  static async softDelete(id) {
    await db.patch(`/users/${id}`, { role: ROLES.INACTIVE });
  }
}

module.exports = User;
