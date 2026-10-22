// Rutas de endpoints monitoreados: /api/endpoints (requieren sesión)
const { Router } = require("express");
const endpointController = require("../controladores/endpoints");
const { authenticate } = require("../middlewares/autenticacion");
const { authorize } = require("../middlewares/roles");
const { validateBody, validateIdParam } = require("../middlewares/validacion");
const { CreateEndpointDto } = require("../dtos/entrada/endpoints");
const { ROLES } = require("../constantes/roles");

const router = Router();
const adminOnly = authorize(ROLES.ADMIN);

router.use(authenticate);

router.get("/", endpointController.list);
router.post("/", adminOnly, validateBody(CreateEndpointDto), endpointController.create);
router.delete("/:id", adminOnly, validateIdParam, endpointController.remove);

module.exports = router;
