/**
 * Envuelve un método async de controlador para enviar
 * cualquier error al middleware de errores (evita try/catch repetidos).
 */
const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

module.exports = asyncHandler;
