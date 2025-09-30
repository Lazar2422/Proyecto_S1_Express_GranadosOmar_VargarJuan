// routes/reviewRoutes.js
import { Router } from "express";
import {
  listReviews,
  createReview,
  deleteReview,
  getReviewsByTitle,
  updateMyReview,
  getMyReviews
} from "../controllers/reviewController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = Router();

// ADMIN (o si quieres público): listar todas
router.get("/", listReviews);

// PÚBLICO: reseñas por película
router.get("/by-title/:movieId", getReviewsByTitle);

// USUARIO: mis reseñas
router.get("/me", requireAuth, getMyReviews);

// USUARIO: crear
router.post("/", requireAuth, createReview);

// USUARIO: editar propia
router.patch("/:id", requireAuth, updateMyReview);

// USUARIO: eliminar propia
router.delete("/:id", requireAuth, deleteReview);

export default router;
