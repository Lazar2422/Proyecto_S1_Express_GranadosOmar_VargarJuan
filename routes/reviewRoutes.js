// routes/reviewRoutes.js
import { Router } from "express";
import {
  listReviews,              // GET /reviews (admin)
  createReview,             // POST /reviews (auth)
  deleteReview,             // DELETE /reviews/:id (admin)
  getReviewsByTitle,        // GET /reviews/by-title/:titleId (público, solo aprobadas)
  updateMyReview,           // PATCH /reviews/:id (propietario o admin)
  approveReview,            // PATCH /reviews/:id/approve (admin)
  rejectReview              // PATCH /reviews/:id/reject (admin)
} from "../controllers/reviewController.js";
import { requireAuth, requireAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

// ADMIN: listar todas (con ?status=approved|pending|rejected opcional)
router.get("/", requireAuth, requireAdmin, listReviews);

// PÚBLICO: reseñas por título (solo aprobadas)
router.get("/by-title/:titleId", getReviewsByTitle);

// USUARIO: crear reseña (queda "pending")
router.post("/", requireAuth, createReview);

// USUARIO (dueño) o ADMIN: editar texto/score
router.patch("/:id", requireAuth, updateMyReview);

// ADMIN: aprobar / rechazar
router.patch("/:id/approve", requireAuth, requireAdmin, approveReview);
router.patch("/:id/reject",  requireAuth, requireAdmin, rejectReview);

// ADMIN: eliminar
router.delete("/:id", requireAuth, requireAdmin, deleteReview);

export default router;
