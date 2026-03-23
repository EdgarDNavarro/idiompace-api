import { Router } from "express";
import { body, param } from "express-validator";
import { clearChatSession, generateFlashcards, getScribeToken, wsChat } from "../handlers/speech.js";
import { handleInputErrors } from "../middleware/index.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// Chat con streaming de audio
router.post(
    "/chat",
    // requireAuth,
    body("text").notEmpty().withMessage("El campo 'text' es obligatorio"),
    body("sessionId").notEmpty().withMessage("El campo 'sessionId' es obligatorio"),
    body("voiceId").notEmpty().withMessage("El campo 'voiceId' es obligatorio"),
    body("idiom").notEmpty().withMessage("El campo 'idiom' es obligatorio"),
    handleInputErrors,
    wsChat
);

router.get(
    "/scribe-token",
    requireAuth,
    getScribeToken
)

// Generar flashcards del historial
router.get(
    "/session/:sessionId/flashcards",
    requireAuth,
    param("sessionId").notEmpty().withMessage("El sessionId es obligatorio"),
    handleInputErrors,
    generateFlashcards
);

// Limpiar sesión de chat
router.delete(
    "/session/:sessionId",
    requireAuth,
    param("sessionId").notEmpty().withMessage("El sessionId es obligatorio"),
    handleInputErrors,
    clearChatSession
);

export default router;
