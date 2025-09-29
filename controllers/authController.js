import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getDB } from "../config/db.js";

// ... forgotPassword que ya tienes ...

export const resetPassword = async (req, res, next) => {
  try {
    const { token, email, password } = req.body || {};
    if (!token || !email || !password) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    // Validar email simple
    const emailNorm = String(email).trim().toLowerCase();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailNorm);
    if (!emailOk) return res.status(400).json({ message: "Correo no válido" });

    // Política de password
    const passOk = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
    if (!passOk) return res.status(400).json({ message: "Password no cumple requisitos" });

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const db = getDB();
    const now = new Date();

    // Busca POR email + token hash + no expirado
    const user = await db.collection("users").findOne(
      {
        email: emailNorm,
        resetPasswordTokenHash: tokenHash,
        resetPasswordExpires: { $gt: now }
      },
      { projection: { _id: 1, tokenVersion: 1 } }
    );

    if (!user) {
      return res.status(400).json({ message: "Token inválido, expirado o correo no coincide" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
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
