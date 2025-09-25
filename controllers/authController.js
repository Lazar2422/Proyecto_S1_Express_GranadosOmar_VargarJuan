import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getDB } from "../config/db.js";

export const register = async (req, res, next) => {
  try {
    const db = getDB();
    const { username, email, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);
    const result = await db.collection("users").insertOne({
      username, email, password: hashed, role: "user", createdAt: new Date()
    });

    res.status(201).json({ msg: "Usuario registrado", id: result.insertedId });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const db = getDB();
    const { email, password } = req.body;

    const user = await db.collection("users").findOne({ email });
    if (!user) return res.status(401).json({ msg: "Credenciales inválidas" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ msg: "Credenciales inválidas" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  } catch (err) {
    next(err);
  }
};
