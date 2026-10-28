// Valida los datos que llegan a cada endpoint con su DTO de petición (backend/dto).
// Construye el DTO de petición con todo lo que envía el cliente (query, body y :parámetros),
// lo valida y lo deja en req.dto. Si no es válido responde 400 con la lista de errores.
// Uso en una ruta: validateRequest(CreateUserRequestDto)
function validateRequest(RequestDto) {
  return (req, res, next) => {
    try {
      req.dto = new RequestDto({ ...req.query, ...(req.body || {}), ...req.params }).assertValid();
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = { validateRequest };
