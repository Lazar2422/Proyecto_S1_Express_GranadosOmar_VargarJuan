// middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import { getDB } from "../config/db.js";
import { ObjectId } from "mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export const requireAuth = async (req, res, next) => {
  const auth = req.headers.authorization || "";
  const [, token] = auth.split(" ");
  if (!token) return res.status(401).json({ message: "No autorizado" });

  try {
    const payload = jwt.verify(token, JWT_SECRET); // { sub, email, tv }
    const db = getDB();
    const u = await db.collection("users").findOne(
      { _id: new ObjectId(payload.sub) },
      { projection: { tokenVersion: 1, role: 1, email: 1, name: 1 } }
    );
    if (!u) return res.status(401).json({ message: "No autorizado" });
    if ((u.tokenVersion || 0) !== (payload.tv || 0)) {
      return res.status(401).json({ message: "Token inválido (desactualizado)" });
    }
    req.user = { id: payload.sub, email: payload.email, role: u.role };
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.role === "admin") return next();
  return res.status(403).json({ message: "Requiere rol admin" });
};
