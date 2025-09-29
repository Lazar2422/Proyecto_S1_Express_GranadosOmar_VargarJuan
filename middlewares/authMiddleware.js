import jwt from "jsonwebtoken";
import { getDB } from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export const requireAuth = async (req, res, next) => {
  try {
    const auth = req.headers.authorization || "";
    const [, token] = auth.split(" "); // "Bearer <token>"

    if (!token) {
      return res.status(401).json({ message: "No autorizado" });
    }

    const payload = jwt.verify(token, JWT_SECRET); // { sub, email, ... }

    const db = getDB();
    const user = await db.collection("users").findOne(
      { _id: new db.bson.ObjectId(payload.sub) }, // si guardaste _id de Mongo en el sub
      { projection: { password: 0 } }              // no traigas password
    );

    if (!user) return res.status(401).json({ message: "No autorizado" });

    req.user = user; // disponible para controladores y otros middlewares
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.role === "admin") return next();
  return res.status(403).json({ message: "Requiere rol administrador" });
};
