/**
 * MIDDLEWARE: Validación de entrada.
 * - validateBody(Dto): construye el DTO desde req.body, lo valida y lo deja en req.dto.
 * - validateIdParam: exige que :id sea un entero positivo.
 */
const HttpError = require("../utils/http-error");
const { isPositiveInteger } = require("../utils/validators");

function validateBody(DtoClass) {
  return (req, res, next) => {
    try {
      req.dto = new DtoClass(req.body || {}).assertValid();
      next();
    } catch (error) {
      next(error);
    }
  };
}

function validateIdParam(req, res, next) {
  if (!isPositiveInteger(req.params.id)) return next(HttpError.badRequest("El id debe ser un número entero positivo"));
  next();
}

module.exports = { validateBody, validateIdParam };
