// tabla codigos_estado_http: 200, 404, 500...
const { Catalog } = require("../config/base-datos");

module.exports = new Catalog("/http-status-codes", "code");
