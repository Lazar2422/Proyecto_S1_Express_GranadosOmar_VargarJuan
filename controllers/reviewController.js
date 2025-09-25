import { getDB } from "../config/db.js";

export const addReview = async (req, res, next) => {
  try {
    const db = getDB();
    const { movieId, title, comment, rating } = req.body;

    const result = await db.collection("reviews").insertOne({
      movieId, userId: req.user._id, title, comment, rating,
      likes: [], dislikes: [], createdAt: new Date()
    });

    res.status(201).json({ msg: "Reseña agregada", id: result.insertedId });
  } catch (err) {
    next(err);
  }
};
