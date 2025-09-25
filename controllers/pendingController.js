import { getDB } from "../config/db.js";
import { ObjectId } from "mongodb";

export const suggestMovie = async (req, res, next) => {
  try {
    const db = getDB();
    const movie = { ...req.body, createdBy: req.user._id, createdAt: new Date() };

    const result = await db.collection("pending_movies").insertOne(movie);
    res.status(201).json({ msg: "Película enviada para aprobación", id: result.insertedId });
  } catch (err) {
    next(err);
  }
};

export const listPending = async (req, res, next) => {
  try {
    const db = getDB();
    const pending = await db.collection("pending_movies").find().toArray();
    res.json(pending);
  } catch (err) {
    next(err);
  }
};

export const approveMovie = async (req, res, next) => {
  try {
    const db = getDB();
    const pendingMovie = await db.collection("pending_movies").findOne({ _id: new ObjectId(req.params.id) });

    if (!pendingMovie) return res.status(404).json({ msg: "Película no encontrada" });

    await db.collection("movies").insertOne({ ...pendingMovie, approvedAt: new Date() });
    await db.collection("pending_movies").deleteOne({ _id: pendingMovie._id });

    res.json({ msg: "Película aprobada y movida al catálogo principal" });
  } catch (err) {
    next(err);
  }
};

export const rejectMovie = async (req, res, next) => {
  try {
    const db = getDB();
    await db.collection("pending_movies").deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ msg: "Película rechazada y eliminada de pendientes" });
  } catch (err) {
    next(err);
  }
};
