class EndpointModel {
  constructor(row) { if (row) Object.assign(this, row); }
  static fromRow(row) { return row ? new EndpointModel(row) : null; }
}
module.exports = EndpointModel;
