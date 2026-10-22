// Construye el DTO de petición del endpoint con todo lo que envía el cliente (query, body y :parámetros),
// lo valida y lo deja en req.dto. Si no es válido responde 400 con la lista de errores.
// Uso en una ruta: validateRequest(CreateUserRequestDto)
function validateRequest(RequestDto) {
  return (req, res, next) => {
    try {
      const input = { ...req.query, ...(req.body || {}), ...req.params };
      req.dto = new RequestDto(input).assertValid();
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = { validateRequest };
