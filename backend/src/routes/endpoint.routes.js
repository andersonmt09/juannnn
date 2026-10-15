/**
 * RUTAS: Endpoints monitoreados  →  /api/endpoints   (requieren sesión)
 */
const { Router } = require("express");
const endpointController = require("../controllers/endpoint.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");
const { validateBody, validateIdParam } = require("../middlewares/validate.middleware");
const { CreateEndpointDto } = require("../dtos/endpoint.dto");
const { ROLES } = require("../constants/roles");

const router = Router();
const adminOnly = authorize(ROLES.ADMIN);

router.use(authenticate);

router.get("/",                                                         endpointController.list);   // RF-12
router.post("/",      adminOnly, validateBody(CreateEndpointDto),       endpointController.create); // RF-13
router.delete("/:id", adminOnly, validateIdParam,                       endpointController.remove); // RF-13

module.exports = router;
