// tabla roles: admin y user
const { Catalog } = require("../config/base-datos");

module.exports = new Catalog("/roles");
