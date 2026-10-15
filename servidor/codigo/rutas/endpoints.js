// Rutas de endpoints monitoreados: /api/endpoints (requieren sesión)
const { Router } = require("express");
const endpointController = require("../controladores/endpoints");
const { authenticate, authorize } = require("../intermediarios/autenticacion");
const { validateBody, validateIdParam } = require("../intermediarios/validacion");
const { CreateEndpointDto } = require("../validadores/endpoints");
const { ROLES } = require("../constantes/roles");

const router = Router();
const adminOnly = authorize(ROLES.ADMIN);

router.use(authenticate);

router.get("/", endpointController.list);
router.post("/", adminOnly, validateBody(CreateEndpointDto), endpointController.create);
router.delete("/:id", adminOnly, validateIdParam, endpointController.remove);

module.exports = router;
