// middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import { getDB } from "../config/db.js";
import { ObjectId } from "mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

function parseBearer(req) {
  const h = req.headers.authorization || "";
  const [scheme, token] = h.split(" ");
  if (!token || String(scheme).toLowerCase() !== "bearer") return null;
  return token;
}

export const requireAuth = async (req, res, next) => {
  try {
    const token = parseBearer(req);
    if (!token) return res.status(401).json({ message: "No autorizado: faltan credenciales" });

    const payload = jwt.verify(token, JWT_SECRET); // -> { sub, email, tv? }
    if (!payload?.sub) return res.status(401).json({ message: "Token inválido" });

    let userId;
    try { userId = new ObjectId(payload.sub); }
    catch { return res.status(401).json({ message: "Token inválido (id)" }); }

    const db = getDB();
    const user = await db.collection("users").findOne(
      { _id: userId },
      { projection: { _id: 1, email: 1, role: 1, tokenVersion: 1, name: 1 } }
    );
    if (!user) return res.status(401).json({ message: "No autorizado (usuario no existe)" });

    // Check opcional de versionado (si usas tv en el JWT)
    const userTV = user.tokenVersion ?? 0;
    const tokenTV = payload.tv ?? 0;
    if (userTV !== tokenTV) {
      return res.status(401).json({ message: "Token inválido (desactualizado)" });
    }

    req.user = { id: user._id.toString(), email: user.email, role: user.role || "user", tv: userTV };
    next();
  } catch (e) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};

export const requireAdmin = (req, res, next) => {
  if (String(req.user?.role || "").toLowerCase() === "admin") return next();
  return res.status(403).json({ message: "Requiere rol admin" });
};
