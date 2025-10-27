import { Router } from "express";
import { handleInputErrors, pagination } from "../middleware";
import { requireAuth } from "../middleware/authMiddleware";
import { generateElevenLabsTTS, generateStoryAndAudio, getTranslation } from "../handlers/dictionary";
import { query } from "express-validator";

const router = Router();

// Crear un daily
router.get(
    "/translate",
    requireAuth,
    query("text").isString().notEmpty(),
    query("sl").isString().notEmpty(),
    handleInputErrors,
    getTranslation
);

router.post(
    "/tts",
    handleInputErrors,
    generateStoryAndAudio
);


export default router;