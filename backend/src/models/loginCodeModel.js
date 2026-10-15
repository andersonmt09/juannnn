class LoginCodeModel {
  constructor(row) { if (row) Object.assign(this, row); }
  static fromRow(row) { return row ? new LoginCodeModel(row) : null; }
}
module.exports = LoginCodeModel;
