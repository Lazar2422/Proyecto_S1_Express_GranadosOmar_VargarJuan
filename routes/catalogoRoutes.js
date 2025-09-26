import { Router } from "express";
import {
  getCatalogo,
  getByCategoria,
  getById,
  createItem,
  updateItem,
  deleteItem,
  searchByTitle,
  getByGenre
} from "../controllers/catalogoController.js";

import { requireAuth, requireAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

// Público
router.get("/", getCatalogo);                   // todo el catálogo
router.get("/categoria/:categoria", getByCategoria); // por categoría
router.get("/search", searchByTitle);           // búsqueda por título ?q=
router.get("/genre/:genre", getByGenre);        // filtro por género
router.get("/:id", getById);                    // detalle por ID

// Protegido (solo admin)
router.post("/", requireAuth, requireAdmin, createItem);
router.put("/:id", requireAuth, requireAdmin, updateItem);
router.delete("/:id", requireAuth, requireAdmin, deleteItem);

export default router;
