import crypto from "crypto";
import bcrypt from "bcrypt";
import { getDB } from "../config/db.js";
import { ObjectId } from "mongodb";

const normEmail = (e) => String(e || "").trim().toLowerCase();

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body || {};
    const FRONT_BASE_URL = process.env.FRONT_BASE_URL || "http://127.0.0.1:5500/html";
    const RESET_TTL_MIN  = parseInt(process.env.RESET_TTL_MIN || "15", 10);
    const isDev = process.env.NODE_ENV !== "production";

    const db = getDB();
    const user = await db.collection("users").findOne({ email: norm(email) });

    if (user) {
      const raw  = crypto.randomBytes(32).toString("hex");            // ← TOKEN CRUDO
      const hash = crypto.createHash("sha256").update(raw).digest("hex");
      const exp  = new Date(Date.now() + RESET_TTL_MIN * 60 * 1000);

      await db.collection("users").updateOne(
        { _id: user._id },
        { $set: { resetPasswordTokenHash: hash, resetPasswordExpires: exp },
          $unset: { resetPasswordToken: "" } }
      );

      const link = `${FRONT_BASE_URL}/reset.html?token=${raw}`;
      console.log("[RESET LINK]", link); // útil igual

      // 👇 DEVUELVE EL TOKEN EN DEV
      return res.json({
        message: "Si el correo existe, te enviamos instrucciones.",
        ...(isDev ? { devToken: raw, link } : {})
      });
    }

    // respuesta neutra si no existe el correo
    return res.json({
  message: "Si el correo existe, te enviamos instrucciones.",
  devToken: raw,               // 👈 fuerza devolver token
  link                          // 👈 y el link
});
  } catch (e) { next(e); }
};

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
export const changePassword = async (req, res, next) => {
  try {
    const db = getDB();
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "No autorizado" });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Faltan campos" });
    }

    // 👇 importante: convertir a ObjectId
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ message: "Contraseña actual incorrecta" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { $set: { password: hashed, updatedAt: new Date() } }
    );

    res.json({ message: "Contraseña actualizada correctamente" });
  } catch (e) {
    next(e);
  }
};
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id; // viene de requireAuth
    const { newName, newEmail, password } = req.body;

    if (!password) return res.status(400).json({ message: "Debes ingresar tu contraseña actual" });

    const db = getDB();
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Contraseña incorrecta" });

    const update = {};
    if (newName) update.name = newName;
    if (newEmail) update.email = newEmail;

    if (!Object.keys(update).length) {
      return res.status(400).json({ message: "No hay cambios que aplicar" });
    }

    update.updatedAt = new Date();
    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { $set: update }
    );

    res.json({ message: "Perfil actualizado", ...update });
  } catch (e) {
    next(e);
  }
};