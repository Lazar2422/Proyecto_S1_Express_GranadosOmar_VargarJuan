import { getDB } from "../config/db.js";
import { ObjectId } from "mongodb";

export const getMe = async (req, res, next) => {
  try {
    // req.user lo setea requireAuth
    res.json({ user: req.user });
  } catch (err) {
    next(err);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const db = getDB();

    const user = await db.collection("users").findOne(
      { _id: new ObjectId(id) },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(user);
  } catch (e) {
    next(e);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const db = getDB();
    const users = await db
      .collection("users")
      .find({}, { projection: { password: 0 } })
      .toArray();

    res.json({ users });
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    let oid;
    try {
      oid = new ObjectId(id);
    } catch {
      return res.status(400).json({ message: "ID inválido" });
    }

    const patch = {};
    if (req.body.name !== undefined) patch.name = String(req.body.name).trim();
    if (req.body.role !== undefined) patch.role = req.body.role;
    if (req.body.banned !== undefined) patch.banned = !!req.body.banned;

    const db = getDB();
    const { modifiedCount } = await db.collection("users").updateOne(
      { _id: oid },
      { $set: patch }
    );

    if (!modifiedCount) {
      return res.status(404).json({ message: "Usuario no encontrado o sin cambios" });
    }

    res.json({ message: "Usuario actualizado" });
  } catch (err) {
    next(err);
  }
};
