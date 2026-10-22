// Rutas de endpoints monitoreados: /api/endpoints (requieren sesión)
const { Router } = require("express");
const endpointController = require("../controladores/endpoints");
const { authenticate } = require("../middlewares/autenticacion");
const { authorize } = require("../middlewares/roles");
const { validateRequest } = require("../middlewares/validacion");
const { CreateEndpointRequestDto, EndpointIdRequestDto } = require("../dtos/peticion/endpoints");
const { ROLES } = require("../constantes/roles");

const router = Router();
const adminOnly = authorize(ROLES.ADMIN);

router.use(authenticate);

router.get("/", endpointController.list);
router.post("/", adminOnly, validateRequest(CreateEndpointRequestDto), endpointController.create);
router.delete("/:id", adminOnly, validateRequest(EndpointIdRequestDto), endpointController.remove);

module.exports = router;
