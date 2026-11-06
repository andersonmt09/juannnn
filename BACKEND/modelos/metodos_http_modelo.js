// tabla metodos_http: GET, POST, PUT, PATCH, DELETE
const { Catalog } = require("../config/base-datos");

module.exports = new Catalog("/http-methods");
