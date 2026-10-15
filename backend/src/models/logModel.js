class LogModel {
  constructor(row) { if (row) Object.assign(this, row); }
  static fromRow(row) { return row ? new LogModel(row) : null; }
}
module.exports = LogModel;
