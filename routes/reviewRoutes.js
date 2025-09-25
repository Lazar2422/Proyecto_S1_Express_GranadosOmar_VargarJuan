import { Router } from "express";
import { addReview } from "../controllers/reviewController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
const router = Router();

router.post("/", requireAuth, addReview);

export default router;
