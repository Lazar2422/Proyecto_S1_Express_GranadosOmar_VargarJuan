import { getDB } from "../config/db.js";
import { ObjectId } from "mongodb";

// 🔹 Obtener todo el catálogo
export const getCatalogo = async (req, res, next) => {
  try {
    const db = getDB();
    const items = await db.collection("catalogo").find().toArray();
    res.json(items);
  } catch (err) {
    next(err);
  }
};

// 🔹 Obtener por categoría (movie, series, anime)
export const getByCategoria = async (req, res, next) => {
  try {
    const db = getDB();
    const { categoria } = req.params;
    const items = await db.collection("catalogo").find({ categoria }).toArray();
    res.json(items);
  } catch (err) {
    next(err);
  }
};

// 🔹 Obtener detalle por ID
export const getById = async (req, res, next) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const item = await db.collection("catalogo").findOne({ _id: new ObjectId(id) });

    if (!item) return res.status(404).json({ msg: "Elemento no encontrado" });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

// 🔹 Crear nuevo item en catálogo
export const createItem = async (req, res, next) => {
  try {
    const db = getDB();
    const newItem = { ...req.body, createdAt: new Date() };
    const result = await db.collection("catalogo").insertOne(newItem);
    res.status(201).json({ msg: "Elemento creado", id: result.insertedId });
  } catch (err) {
    next(err);
  }
};

// 🔹 Actualizar item
export const updateItem = async (req, res, next) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const result = await db.collection("catalogo").updateOne(
      { _id: new ObjectId(id) },
      { $set: req.body }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ msg: "Elemento no encontrado" });
    }

    res.json({ msg: "Elemento actualizado" });
  } catch (err) {
    next(err);
  }
};

// 🔹 Eliminar item
export const deleteItem = async (req, res, next) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const result = await db.collection("catalogo").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ msg: "Elemento no encontrado" });
    }

    res.json({ msg: "Elemento eliminado" });
  } catch (err) {
    next(err);
  }
};

// 🔹 Buscar por título (case-insensitive)
export const searchByTitle = async (req, res, next) => {
  try {
    const db = getDB();
    const { q } = req.query;

    if (!q) return res.status(400).json({ msg: "Debe enviar un término de búsqueda" });

    const results = await db.collection("catalogo").find({
      title: { $regex: q, $options: "i" }
    }).toArray();

    res.json(results);
  } catch (err) {
    next(err);
  }
};

// 🔹 Filtrar por género
export const getByGenre = async (req, res, next) => {
  try {
    const db = getDB();
    const { genre } = req.params;

    const results = await db.collection("catalogo").find({
      genres: genre
    }).toArray();

    res.json(results);
  } catch (err) {
    next(err);
  }
};
