import { Router } from "express";
import { getUsers, getMe } from "../controllers/userController.js";
import { requireAuth, requireAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

// Quién soy (solo autenticado)
router.get("/me", requireAuth, getMe);

// Listar usuarios (solo admin)
router.get("/", requireAuth, requireAdmin, getUsers);

export default router;
