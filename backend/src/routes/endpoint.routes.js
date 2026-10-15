// Rutas de endpoints monitoreados: /api/endpoints (requieren sesión)
const { Router } = require("express");
const endpointController = require("../controllers/endpoint.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");
const { validateBody, validateIdParam } = require("../middlewares/validate.middleware");
const { CreateEndpointDto } = require("../dtos/endpoint.dto");
const { ROLES } = require("../constants/roles");

const router = Router();
const adminOnly = authorize(ROLES.ADMIN);

router.use(authenticate);

router.get("/", endpointController.list);
router.post("/", adminOnly, validateBody(CreateEndpointDto), endpointController.create);
router.delete("/:id", adminOnly, validateIdParam, endpointController.remove);

module.exports = router;
