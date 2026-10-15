const express = require("express");
const router = express.Router();
const { authMiddleware, requireRole } = require("../middleware/auth");
const userController = require("../controllers/userController");

router.use(authMiddleware);
router.get("/", userController.list);
router.get("/:id", userController.get);
router.post("/", requireRole("admin"), userController.create);
router.put("/:id", requireRole("admin"), userController.update);
router.patch("/:id/password", userController.changePassword);
router.delete("/:id", requireRole("admin"), userController.remove);

module.exports = router;
