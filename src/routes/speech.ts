import { Router } from "express";
import { body, param } from "express-validator";
import { clearChatSession, getScribeToken, wsChat } from "../handlers/speech.js";
import { handleInputErrors } from "../middleware/index.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// Chat con streaming de audio
router.post(
    "/chat",
    // requireAuth,
    body("text").notEmpty().withMessage("El campo 'text' es obligatorio"),
    body("sessionId").notEmpty().withMessage("El campo 'sessionId' es obligatorio"),
    handleInputErrors,
    wsChat
);

router.get(
    "/scribe-token",
    requireAuth,
    getScribeToken
)

// Limpiar sesión de chat
router.delete(
    "/session/:sessionId",
    requireAuth,
    param("sessionId").notEmpty().withMessage("El sessionId es obligatorio"),
    handleInputErrors,
    clearChatSession
);

export default router;
