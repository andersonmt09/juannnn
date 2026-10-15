// Modelo/entidad Usuario - representación interna (puede contener datos sensibles)
class UserModel {
  constructor(row) {
    if (!row) return;
    Object.assign(this, row);
  }
  static fromRow(row) { return row ? new UserModel(row) : null; }
  isActive() { return this.role !== "inactive"; }
  isAdmin() { return this.role === "admin"; }
}
module.exports = UserModel;
