// controllers/reviewController.js
import { getDB } from "../config/db.js";
import { ObjectId } from "mongodb";

// Helpers
const oid = (s) => {
  try { return new ObjectId(String(s)); } catch { return null; }
};
const cleanText = (v) => String(v || "").trim();
const clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n)));

/* ==================== LISTAR TODAS (ADMIN) ==================== */
export const listReviews = async (req, res, next) => {
  try {
    const db = getDB();
    const items = await db.collection("reviews")
      .find()
      .sort({ createdAt: -1 })
      .limit(500)
      .toArray();

    res.json({ items });
  } catch (e) { next(e); }
};

/* ==================== OBTENER RESEÑAS POR PELÍCULA ==================== */
export const getReviewsByTitle = async (req, res, next) => {
  try {
    const movieId = req.params.movieId;
    if (!movieId) return res.status(400).json({ message: "movieId requerido" });

    const db = getDB();
    const items = await db.collection("reviews")
      .find({ movieId })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ items });
  } catch (e) { next(e); }
};

/* ==================== CREAR ==================== */
export const createReview = async (req, res, next) => {
  try {pruebe
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "No autorizado" });

    const { movieId, title, comment, rating } = req.body;
    if (!movieId) return res.status(400).json({ message: "movieId requerido" });
    if (!rating) return res.status(400).json({ message: "rating requerido (1–5)" });

    const db = getDB();
    const doc = {
      movieId,
      userId,
      title: cleanText(title),
      estado:cleanText(creada),
      comment: cleanText(comment),
      rating: clamp(rating, 1, 5),
      createdAt: new Date(),
    };

    const { insertedId } = await db.collection("reviews").insertOne(doc);
    res.status(201).json({ id: insertedId, message: "Reseña creada" });
  } catch (e) { next(e); }
};

/* ==================== EDITAR ==================== */
export const updateMyReview = async (req, res, next) => {
  try {
    const id = oid(req.params.id);
    if (!id) return res.status(400).json({ message: "id inválido" });

    const db = getDB();
    const review = await db.collection("reviews").findOne({ _id: id });
    if (!review) return res.status(404).json({ message: "No existe" });

    const isOwner = String(review.userId) === String(req.user?.id);
    if (!isOwner) return res.status(403).json({ message: "No permitido" });

    const patch = {};
    if (req.body?.comment !== undefined) patch.comment = cleanText(req.body.comment);
    if (req.body?.rating !== undefined) patch.rating = clamp(req.body.rating, 1, 5);

    await db.collection("reviews").updateOne({ _id: id }, { $set: patch });
    res.json({ message: "Reseña actualizada" });
  } catch (e) { next(e); }
};

/* ==================== ELIMINAR ==================== */
export const deleteReview = async (req, res, next) => {
  try {
    const id = oid(req.params.id);
    if (!id) return res.status(400).json({ message: "id inválido" });

    const db = getDB();
    await db.collection("reviews").deleteOne({ _id: id });
    res.status(204).end();
  } catch (e) { next(e); }
};

/* ==================== OBTENER MIS RESEÑAS ==================== */
export const getMyReviews = async (req, res, next) => {
  try {
    const db = getDB();
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "No autorizado" });

    const items = await db.collection("reviews")
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ items });
  } catch (e) { next(e); }
};
