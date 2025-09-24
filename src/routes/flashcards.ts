import { Router } from "express";
import { body, param } from "express-validator";
import {
    createFlashcard,
    getFlashcards,
    updateFlashcard,
    deleteFlashcard,
    getDueFlashcards,
    markCorrect,
    markWrong,
} from "../handlers/flashcard";
import { handleInputErrors } from "../middleware";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

// Crear una flashcard
router.post(
    "/",
    requireAuth,
    body("front").notEmpty().withMessage("El campo 'front' es obligatorio"),
    body("back").notEmpty().withMessage("El campo 'back' es obligatorio"),
    body("example").notEmpty().withMessage("El campo 'example' es obligatorio"),
    handleInputErrors,
    createFlashcard
);

// Listar flashcards a hacer por userId
router.get(
    "/due",
    requireAuth,
    handleInputErrors,
    getDueFlashcards
);

// Listar flashcards por userId
router.get(
    "/",
    requireAuth,
    handleInputErrors,
    getFlashcards
);

// Editar una flashcard
router.put(
    "/:id",
    requireAuth,
    param("id").notEmpty().withMessage("El parámetro 'id' es obligatorio"),
    body("front").optional().notEmpty().withMessage("El campo 'front' no puede estar vacío"),
    body("back").optional().notEmpty().withMessage("El campo 'back' no puede estar vacío"),
    body("example").optional().notEmpty().withMessage("El campo 'example' no puede estar vacío"),
    handleInputErrors,
    updateFlashcard
);

router.put(
    "/mark-correct/:id",
    requireAuth,
    param("id").notEmpty().withMessage("El parámetro 'id' es obligatorio"),
    handleInputErrors,
    markCorrect
);

router.put(
    "/mark-wrong/:id",
    requireAuth,
    param("id").notEmpty().withMessage("El parámetro 'id' es obligatorio"),
    handleInputErrors,
    markWrong
);

// Eliminar una flashcard
router.delete(
    "/:id",
    requireAuth,
    param("id").notEmpty().withMessage("El parámetro 'id' es obligatorio"),
    handleInputErrors,
    deleteFlashcard
);

export default router;