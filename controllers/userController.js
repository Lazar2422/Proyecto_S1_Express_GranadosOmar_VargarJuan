import { getDB } from "../config/db.js";

export const getUsers = async (req, res, next) => {
  try {
    const db = getDB();
    const users = await db.collection("users").find().toArray();
    res.json(users);
  } catch (err) {
    next(err);
  }
};
