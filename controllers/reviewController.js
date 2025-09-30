// controllers/reviewController.js
import { getDB } from "../config/db.js";
import { ObjectId } from "mongodb";

// Helpers
const oid = (s) => {
  try { return new ObjectId(String(s)); } catch { return null; }
};
const cleanText = (v) => String(v || "").trim();
const clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n)));

export const listReviews = async (req, res, next) => {
  try {
    const db = getDB();
    const status = (req.query.status || "").toLowerCase();
    const q = {};
    if (["pending","approved","rejected"].includes(status)) q.status = status;

    const items = await db.collection("reviews")
      .find(q)
      .sort({ createdAt: -1 })
      .limit(500) // evita traer infinitas en un panel
      .toArray();

    res.json({ items });
  } catch (e) { next(e); }
};

export const getReviewsByTitle = async (req, res, next) => {
  try {
    const titleId = oid(req.params.titleId);
    if (!titleId) return res.status(400).json({ message: "titleId inválido" });

    const db = getDB();
    const items = await db.collection("reviews")
      .find({ titleId, status: "approved" })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ items });
  } catch (e) { next(e); }
};

export const createReview = async (req, res, next) => {
  try {
    const userId = oid(req.user?.id);
    if (!userId) return res.status(401).json({ message: "No autorizado" });

    const titleId = oid(req.body?.titleId);
    const score = clamp(req.body?.score, 1, 5);
    const comment = cleanText(req.body?.comment);

    if (!titleId) return res.status(400).json({ message: "titleId requerido" });
    if (!score)   return res.status(400).json({ message: "score requerido (1–5)" });

    const db = getDB();
    const doc = {
      titleId,
      userId,
      score,
      comment,
      status: "pending",     // visible tras aprobación
      likes: 0,
      dislikes: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const { insertedId } = await db.collection("reviews").insertOne(doc);
    res.status(201).json({ id: insertedId, message: "Reseña enviada (pendiente de aprobación)" });
  } catch (e) { next(e); }
};

export const updateMyReview = async (req, res, next) => {
  try {
    const id = oid(req.params.id);
    if (!id) return res.status(400).json({ message: "id inválido" });

    const db = getDB();
    const review = await db.collection("reviews").findOne({ _id: id });
    if (!review) return res.status(404).json({ message: "No existe" });

    const isOwner = String(review.userId) === String(req.user?.id);
    const isAdmin  = String(req.user?.role || "").toLowerCase() === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "No permitido" });

    const patch = {};
    if (req.body?.comment !== undefined) patch.comment = cleanText(req.body.comment);
    if (req.body?.score   !== undefined) patch.score   = clamp(req.body.score, 1, 5);
    patch.updatedAt = new Date();

    // Si edita el usuario, vuelve a "pending"
    if (isOwner && !isAdmin) patch.status = "pending";

    await db.collection("reviews").updateOne({ _id: id }, { $set: patch });
    res.json({ message: "Actualizado" });
  } catch (e) { next(e); }
};

export const approveReview = async (req, res, next) => {
  try {
    const id = oid(req.params.id);
    if (!id) return res.status(400).json({ message: "id inválido" });

    const db = getDB();
    await db.collection("reviews").updateOne(
      { _id: id },
      { $set: { status: "approved", updatedAt: new Date(), rejectedReason: null } }
    );
    res.json({ message: "Aprobada" });
  } catch (e) { next(e); }
};

export const rejectReview = async (req, res, next) => {
  try {
    const id = oid(req.params.id);
    if (!id) return res.status(400).json({ message: "id inválido" });

    const reason = cleanText(req.body?.reason);
    const db = getDB();
    await db.collection("reviews").updateOne(
      { _id: id },
      { $set: { status: "rejected", rejectedReason: reason || null, updatedAt: new Date() } }
    );
    res.json({ message: "Rechazada" });
  } catch (e) { next(e); }
};

export const deleteReview = async (req, res, next) => {
  try {
    const id = oid(req.params.id);
    if (!id) return res.status(400).json({ message: "id inválido" });

    const db = getDB();
    await db.collection("reviews").deleteOne({ _id: id });
    res.status(204).end();
  } catch (e) { next(e); }
};
export const getMyReviews = async (req, res, next) => {
  try {
    const db = getDB();
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "No autorizado" });
    }

    const items = await db.collection("reviews")
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ items });
  } catch (e) {
    next(e);
  }
};