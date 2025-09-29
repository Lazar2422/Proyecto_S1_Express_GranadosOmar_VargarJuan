import { getDB } from "../config/db.js";

export const getMe = async (req, res, next) => {
  try {
    // req.user lo setea requireAuth
    // Devuelve un usuario “sanitizado” (sin password)
    res.json({ user: req.user });
  } catch (err) {
    next(err);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const db = getDB();
    // NUNCA devuelvas password
    const users = await db
      .collection("users")
      .find({}, { projection: { password: 0 } })
      .toArray();

    res.json({ users });
  } catch (err) {
    next(err);
  }
};
