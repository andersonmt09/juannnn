// valida la petición con su DTO
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
