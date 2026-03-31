import { Router } from "express";
import { body, param } from "express-validator";
import {
    clearChatSession,
    generateFlashcards,
    getScribeToken,
    wsChat,
    startSession,
    endSession,
    getQuota,
} from "../handlers/speech.js";
import { handleInputErrors } from "../middleware/index.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { scribeTokenLimiter, chatStreamLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// Iniciar sesión de llamada: verifica cuota, obtiene token Scribe y registra sesión
router.post("/session/start", requireAuth, startSession);

// Finalizar sesión: registra duración consumida y actualiza cuota
router.post(
    "/session/end",
    requireAuth,
    body("sessionId").notEmpty(),
    body("durationSeconds").isNumeric(),
    handleInputErrors,
    endSession
);

// Consultar cuota diaria del usuario
router.get("/quota", requireAuth, getQuota);

// Chat con streaming de audio — requiere sesión válida registrada
router.post(
    "/chat",
    requireAuth,
    chatStreamLimiter,
    body("text").notEmpty().withMessage("El campo 'text' es obligatorio"),
    body("sessionId").notEmpty().withMessage("El campo 'sessionId' es obligatorio"),
    body("voiceId").notEmpty().withMessage("El campo 'voiceId' es obligatorio"),
    body("idiom").notEmpty().withMessage("El campo 'idiom' es obligatorio"),
    handleInputErrors,
    wsChat
);

// Scribe token directo (fallback, ya no usado por el flujo principal)
router.get("/scribe-token", scribeTokenLimiter, requireAuth, getScribeToken);

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
