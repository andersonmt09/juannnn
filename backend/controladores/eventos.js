const { Router } = require("express");
const { ROLES } = require("../configuracion");
const { authenticate, authenticateFromQuery, authorize } = require("../middlewares/autenticacion");
const { validateRequest } = require("../middlewares/validacion");
const { StreamRequestDto, stream, ping } = require("../dto/eventos");

const router = Router();

// GET /api/events/stream?token= - admin
router.get("/stream", authenticateFromQuery, authorize(ROLES.ADMIN), validateRequest(StreamRequestDto), stream);
// POST /api/events/ping - admin
router.post("/ping", authenticate, authorize(ROLES.ADMIN), ping);

module.exports = router;
