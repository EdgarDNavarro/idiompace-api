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
    getDecks,
    createDeck,
    deleteDeck,
} from "../handlers/flashcard";
import { handleInputErrors } from "../middleware";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

// Crear una flashcard
router.post(
    "/",
    requireAuth,
    body("deckId").notEmpty().withMessage("El parámetro 'deckId' es obligatorio"),
    body("front").notEmpty().withMessage("El campo 'front' es obligatorio"),
    body("back").notEmpty().withMessage("El campo 'back' es obligatorio"),
    body("example").notEmpty().withMessage("El campo 'example' es obligatorio"),
    handleInputErrors,
    createFlashcard
);

// Listar flashcards a hacer por deckId
router.get(
    "/due/:deckId",
    requireAuth,
    param("deckId").notEmpty().withMessage("El parámetro 'id' es obligatorio"),
    handleInputErrors,
    getDueFlashcards
);

// Listar flashcards por deckId
router.get(
    "/list/:deckId",
    requireAuth,
    param("deckId").notEmpty().withMessage("El parámetro 'id' es obligatorio"),
    handleInputErrors,
    getFlashcards
);

// Editar una flashcard
router.put(
    "/:id",
    requireAuth,
    param("id").notEmpty().withMessage("El parámetro 'id' es obligatorio"),
    body("front").notEmpty().withMessage("El campo 'front' no puede estar vacío"),
    body("back").notEmpty().withMessage("El campo 'back' no puede estar vacío"),
    body("example").notEmpty().withMessage("El campo 'example' no puede estar vacío"),
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

//Decks
router.post(
    "/decks",
    requireAuth,
    body("name").notEmpty().withMessage("El campo 'front' no puede estar vacío"),
    handleInputErrors,
    createDeck
);

router.get(
    "/decks",
    requireAuth,
    handleInputErrors,
    getDecks
);

router.delete(
    "/decks/:id",
    requireAuth,  
    handleInputErrors,
    deleteDeck
);

export default router;