import { Router } from "express";
import {
  getCatalogo,
  getByCategoria,
  getById,
  createItem,
  updateItem,
  deleteItem,
  searchByTitle,
  getByGenre,
  patchItem
} from "../controllers/catalogoController.js";

import { requireAuth, requireAdmin } from "../middlewares/authMiddleware.js";

const router = Router();
router.patch("/:id/like", requireAuth, async (req, res, next) => {
  try {
    const db = getDB();
    const { action } = req.body; // "like" | "dislike" | "none"
    const userId = req.user.id;  // viene del token en requireAuth

    const result = await db.collection("catalogo").findOneAndUpdate(
      { _id: req.params.id },
      {
        $pull: { likes: userId, dislikes: userId }, // limpia primero
        ...(action === "like" ? { $addToSet: { likes: userId } } : {}),
        ...(action === "dislike" ? { $addToSet: { dislikes: userId } } : {})
      },
      { returnDocument: "after" }
    );

    res.json({
      likes: result.value.likes?.length || 0,
      dislikes: result.value.dislikes?.length || 0
    });
  } catch (err) {
    next(err);
  }
});
// Público
router.get("/", getCatalogo);                   // todo el catálogo
router.get("/categoria/:categoria", getByCategoria); // por categoría
router.get("/search", searchByTitle);           // búsqueda por título ?q=
router.get("/genre/:genre", getByGenre);        // filtro por género
router.get("/:id", getById);                    // detalle por ID

// Protegido (solo admin)
router.patch("/:id", requireAuth, requireAdmin, patchItem);
router.post("/", requireAuth, requireAdmin, createItem);
router.put("/:id", requireAuth, requireAdmin, updateItem);
router.delete("/:id", requireAuth, requireAdmin, deleteItem);

export default router;
