// tabla servicios: los que se revisan en el estado del sistema
const { Catalog } = require("../config/base-datos");

module.exports = new Catalog("/services");
