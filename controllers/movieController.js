import { getDB } from "../config/db.js";

export const getMovies = async (req, res, next) => {
  try {
    const db = getDB();
    const movies = await db.collection("movies").find().toArray();
    res.json(movies);
  } catch (err) {
    next(err);
  }
};
