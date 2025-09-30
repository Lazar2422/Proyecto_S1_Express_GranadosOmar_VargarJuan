import express from "express";
import { getDB } from "../config/db.js";

const router = express.Router();

// GET /api/v1/genres
router.get("/genres", async (req, res, next) => {
  try {
    const db = getDB(); // 👈 usar getDB()
    const genres = await db.collection("genres").find().toArray();
    res.json(genres);
  } catch (err) {
    next(err);
  }
});

export default router;
