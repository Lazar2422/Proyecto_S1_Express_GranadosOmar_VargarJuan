import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { getDB } from "../config/db.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { forgotPassword, resetPassword, changePassword } from "../controllers/authController.js";
import { updateProfile } from "../controllers/authController.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

const sign = (user) =>
  jwt.sign(
    { sub: user._id.toString(), email: user.email, tv: user.tokenVersion || 0 },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  // POST /api/v1/auth/register
  router.post("/register", async (req, res, next) => {
    try {
      const { name, email, password } = req.body || {};
      if (!name || !email || !password)
        return res.status(400).json({ message: "Faltan campos" });
      
      const db = getDB();
    const emailNorm = String(email).trim().toLowerCase();

    const exists = await db.collection("users").findOne({ email: emailNorm });
    if (exists) return res.status(409).json({ message: "Email ya registrado" });
    
    const passwordHash = await bcrypt.hash(password, 10);
    const doc = {
      name,
      email: emailNorm,
      password: passwordHash,
      role: "user",
      createdAt: new Date(),
      tokenVersion: 0,
    };
    
    const { insertedId } = await db.collection("users").insertOne(doc);
    
    return res
    .status(201)
    .json({ message: "Usuario creado", user: { id: insertedId, name, email: emailNorm } });
  } catch (e) {
    next(e);
  }
});

// POST /api/v1/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const emailNorm = String(email || "").trim().toLowerCase();
    
    const db = getDB();
    const user = await db.collection("users").findOne({ email: emailNorm });
    if (!user) return res.status(401).json({ message: "Credenciales inválidas" });
    
    const ok = await bcrypt.compare(String(password || ""), String(user.password || ""));
    if (!ok) return res.status(401).json({ message: "Credenciales inválidas" });
    
    const token = sign(user);
    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name ?? user.username ?? "",
        email: user.email,
        role: user.role ?? "user",
      },
    });
  } catch (e) { next(e); }
});

// Forgot / Reset
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.patch("/password", requireAuth, changePassword);
router.patch("/profile", requireAuth, updateProfile);
router.patch("/profile", requireAuth, updateProfile);
export default router;
