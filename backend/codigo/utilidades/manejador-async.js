// Envuelve un controlador async para que sus errores lleguen a middlewares/errores.js.
const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

module.exports = asyncHandler;
