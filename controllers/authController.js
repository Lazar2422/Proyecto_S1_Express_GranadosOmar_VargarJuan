import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getDB } from "../config/db.js";

const FRONT_BASE_URL = process.env.FRONT_BASE_URL || "http://127.0.0.1:5500"; // Live Server
const RESET_TTL_MIN = parseInt(process.env.RESET_TTL_MIN || "15", 10);       // 15 min por defecto

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: "Email requerido" });

    const db = getDB();
    const user = await db.collection("users").findOne({ email });
    // Respuesta SIEMPRE 200 para no filtrar qué emails existen
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const expiresAt = new Date(Date.now() + RESET_TTL_MIN * 60 * 1000);

      await db.collection("users").updateOne(
        { _id: user._id },
        { $set: { resetPasswordTokenHash: tokenHash, resetPasswordExpires: expiresAt } }
      );

      const resetUrl = `${FRONT_BASE_URL}/reset.html?token=${token}`;

      // En dev, imprime el enlace en consola:
      console.log(`[RESET LINK] ${resetUrl}`);

      // En prod podrías enviar email con nodemailer aquí.
      // (Si quieres, te dejo la plantilla de nodemailer en otro mensaje).
    }

    return res.json({ message: "Si el email existe, te enviamos instrucciones." });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) return res.status(400).json({ message: "Datos incompletos" });

    // Valida política de password (mismo regex que en el front)
    const okPass = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
    if (!okPass) return res.status(400).json({ message: "Password no cumple requisitos" });

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const db = getDB();
    const now = new Date();

    const user = await db.collection("users").findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: now }
    });

    if (!user) return res.status(400).json({ message: "Token inválido o expirado" });

    const passwordHash = await bcrypt.hash(password, 10);

    // Opcional: invalidar sesiones JWT existentes subiendo tokenVersion
    const newVersion = (user.tokenVersion || 0) + 1;

    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: { password: passwordHash, tokenVersion: newVersion },
        $unset: { resetPasswordTokenHash: "", resetPasswordExpires: "" }
      }
    );

    return res.json({ message: "Contraseña actualizada. Ya puedes iniciar sesión." });
  } catch (err) {
    next(err);
  }
};
