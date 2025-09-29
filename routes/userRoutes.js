import { Router } from "express";
import { requireAuth, requireAdmin } from "../middlewares/authMiddleware.js";
import { getUsers } from "../controllers/userController.js";
import { getDB } from "../config/db.js";
import { ObjectId } from "mongodb";

const router = Router();

router.get("/", requireAuth, requireAdmin, getUsers);

router.get("/me", requireAuth, async (req, res) => {
  const db = getDB();
  const me = await db.collection("users").findOne(
    { _id: new ObjectId(req.user.id) },
    { projection: { _id: 1, name: 1, email: 1, role: 1, createdAt: 1 } }
  );
  res.json(me);
});

export default router;