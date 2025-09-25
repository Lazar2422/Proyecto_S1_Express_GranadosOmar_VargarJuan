import { Router } from "express";
import { getUsers } from "../controllers/userController.js";
import { requireAuth, requireAdmin } from "../middlewares/authMiddleware.js";
const router = Router();

router.get("/", requireAuth, requireAdmin, getUsers);

export default router;
