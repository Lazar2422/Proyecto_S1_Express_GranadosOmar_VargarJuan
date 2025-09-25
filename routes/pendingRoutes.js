import { Router } from "express";
import { suggestMovie, listPending, approveMovie, rejectMovie } from "../controllers/pendingController.js";
import { requireAuth, requireAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

// Usuario sugiere
router.post("/", requireAuth, suggestMovie);

// Admin ve pendientes
router.get("/", requireAuth, requireAdmin, listPending);

// Admin aprueba/rechaza
router.post("/:id/approve", requireAuth, requireAdmin, approveMovie);
router.delete("/:id", requireAuth, requireAdmin, rejectMovie);

export default router;
