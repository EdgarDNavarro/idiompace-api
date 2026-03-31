import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { uploadPdf, uploadImage } from "../middleware/upload.js";
import { generateFlashcardsFromPdf, generateFlashcardsFromImage } from "../handlers/upload.js";
import { uploadPdfLimiter, uploadImageLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// POST /api/upload/pdf — sube un PDF y genera flashcards (máx. 15 páginas, 3/día)
router.post(
    "/pdf",
    requireAuth,
    uploadPdfLimiter,
    uploadPdf.single("file"),
    generateFlashcardsFromPdf
);

// POST /api/upload/image — sube una imagen y genera flashcards con visión IA (5/día)
router.post(
    "/image",
    requireAuth,
    uploadImageLimiter,
    uploadImage.single("file"),
    generateFlashcardsFromImage
);

export default router;
