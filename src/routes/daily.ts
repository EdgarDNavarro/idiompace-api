import { Router } from "express";
import { body } from "express-validator";
import { createDaily, getTodayDaily, listDailies } from "../handlers/daily";
import { handleInputErrors } from "../middleware";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

// Crear un daily
router.post(
    "/",
    body("phrase").notEmpty().withMessage("El campo 'phrase' es obligatorio"),
    body("phrase_translation").notEmpty().withMessage("El campo 'phrase_translation' es obligatorio"),
    body("example").notEmpty().withMessage("El campo 'example' es obligatorio"),
    body("example_translation").notEmpty().withMessage("El campo 'example_translation' es obligatorio"),
    handleInputErrors,
    createDaily
);

// Traer el daily de hoy
router.get(
    "/today",
    requireAuth,
    getTodayDaily
);

// Listar todos los daily
router.get(
    "/",
    requireAuth,
    listDailies
);

export default router;