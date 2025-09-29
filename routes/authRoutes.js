// routes/authRoutes.js
import { Router } from "express";
import { forgotPassword, resetPassword } from "../controllers/authController.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
// Importa tu modelo real:
import User from "../models/User.js"; // adapta la ruta
const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const sign = (user) =>
  jwt.sign({ sub: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: "1h" });

// POST /api/v1/auth/register
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ message: "Faltan campos" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "Email ya registrado" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: passwordHash });

    return res.status(201).json({ message: "Usuario creado", user: { id: user._id, name, email } });
  } catch (e) { next(e); }
});

// POST /api/v1/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Credenciales inválidas" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Credenciales inválidas" });

    const token = sign(user);
    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (e) { next(e); }
});

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
export default router;
