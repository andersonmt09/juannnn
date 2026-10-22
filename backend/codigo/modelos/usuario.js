// Modelo de usuario. Los datos viven en la base de datos externa (recurso /users).
const db = require("../base-datos/cliente-bd");
const { ROLES } = require("../seguridad/constantes/roles");

class User {
  constructor(row) {
    this.id = row.id;
    this.name = row.name;
    this.email = row.email;
    this.passwordHash = row.password_hash;
    this.role = row.role;
    this.emailVerified = Boolean(row.email_verified);
    this.isSample = Boolean(row.is_sample);
    this.createdById = row.created_by_id;
    this.createdDate = row.created_date;
    this.updatedDate = row.updated_date;
  }

  isActive() { return this.role !== ROLES.INACTIVE; }
  isAdmin() { return this.role === ROLES.ADMIN; }

  static fromRow(row) { return row ? new User(row) : null; }

  // ---------- Consultas ----------

  static async findById(id) {
    return User.fromRow(await db.find(`/users/${id}`));
  }

  static async findByEmail(email) {
    const { data } = await db.get("/users", { email, includeInactive: true, limit: 1 });
    return User.fromRow(data[0]);
  }

  static async findAll({ includeInactive = false, page = 1, limit = 50 } = {}) {
    const { data, total } = await db.get("/users", { includeInactive, page, limit });
    return { users: data.map(User.fromRow), total };
  }

  static async countByRole() {
    return db.get("/users/count-by-role");
  }

  // ---------- Escritura ----------

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

  static async updatePassword(id, passwordHash) {
    await db.patch(`/users/${id}`, { password_hash: passwordHash });
  }

  static async markEmailVerified(email) {
    const user = await User.findByEmail(email);
    if (user) await db.patch(`/users/${user.id}`, { email_verified: true });
  }

  // Eliminación lógica: el registro se conserva con rol inactive.
  static async softDelete(id) {
    await db.patch(`/users/${id}`, { role: ROLES.INACTIVE });
  }
}

module.exports = User;
