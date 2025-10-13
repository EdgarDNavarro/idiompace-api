import { Router } from "express";
import { body, param, query } from "express-validator";
import {
    createVocabulary,
    deleteVocabulary,
    getVocabularies,
    updateVocabulary
} from "../handlers/vocabulary";
import { handleInputErrors } from "../middleware";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

// Obtener vocabularios (puedes filtrar por storyId)
router.get(
    "/",
    requireAuth,
    query("storyId").optional().isInt().withMessage("storyId debe ser un número entero"),
    handleInputErrors,
    getVocabularies
);

// Crear vocabulario
router.post(
    "/",
    requireAuth,
    body("vocabulary").notEmpty().withMessage("El campo 'vocabulary' es obligatorio"),
    body("translation").notEmpty().withMessage("El campo 'translation' es obligatorio"),
    body("storyId").isInt().withMessage("El campo 'storyId' debe ser un número entero"),
    handleInputErrors,
    createVocabulary
);

// Actualizar vocabulario
router.put(
    "/:id",
    requireAuth,
    param("id").isInt().withMessage("ID inválido"),
    body("vocabulary").notEmpty().withMessage("El campo 'vocabulary' es obligatorio"),
    body("translation").notEmpty().withMessage("El campo 'translation' es obligatorio"),
    body("storyId").isInt().withMessage("El campo 'storyId' debe ser un número entero"),
    handleInputErrors,
    updateVocabulary
);

// Eliminar vocabulario
router.delete(
    "/:id",
    requireAuth,
    param("id").isInt().withMessage("ID inválido"),
    handleInputErrors,
    deleteVocabulary
);

export default router;