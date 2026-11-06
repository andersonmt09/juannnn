// tabla estados_usuario: active e inactive
const { Catalog } = require("../config/base-datos");

module.exports = new Catalog("/user-statuses");
