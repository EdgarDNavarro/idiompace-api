import { Router } from "express"
import { body, param } from "express-validator";
import {
    getStories,
    getStoryById,
    createStory,
    updateStory,
    toggleIsInteractive,
    deleteStory,
} from '../handlers/story';
import { handleInputErrors, pagination } from "../middleware";
import { requireAuth } from "../middleware/authMiddleware";
const router = Router()


router.get("/", requireAuth, pagination(10, 50), getStories);

router.get(
    "/:id",
    requireAuth,
    param("id").isInt().withMessage("ID inválido"),
    handleInputErrors,
    getStoryById
);

router.post(
    "/",
    requireAuth,
    body("title").notEmpty().withMessage("El título es obligatorio"),
    body("idiom").notEmpty().withMessage("El Idioma es obligatorio"),
    body("description").notEmpty().withMessage("La descripción es obligatoria"),
    body("phrases")
        .isArray({ min: 1 })
        .withMessage("Debe contener al menos una frase"),
    body("phrases.*.english")
        .notEmpty()
        .withMessage("Cada frase debe tener 'english'"),
    body("phrases.*.spanish")
        .notEmpty()
        .withMessage("Cada frase debe tener 'spanish'"),
    body("phrases.*.startTime")
        .isNumeric()
        .withMessage("startTime debe ser numérico"),
    body("phrases.*.endTime")
        .isNumeric()
        .withMessage("endTime debe ser numérico"),
    body("categories")
        .isArray()
        .withMessage("categories debe ser un array")
        .default([]),
    body("is_interactive")
        .optional()
        .isBoolean()
        .withMessage("is_interactive debe ser boolean"),
    body("level")
        .isIn(["low", "middle", "high"])
        .withMessage("level debe ser 'low', 'middle' o 'high'"),
    handleInputErrors,
    createStory
);

router.put(
    "/:id",
    requireAuth,
    param("id").isInt().withMessage("ID inválido"),
    body("title").notEmpty().withMessage("El título es obligatorio"),
    body("idiom").notEmpty().withMessage("El Idioma es obligatorio"),
    body("description").notEmpty().withMessage("La descripción es obligatoria"),
    body("phrases").isArray().withMessage("phrases debe ser un array"),
    body("categories")
        .isArray()
        .withMessage("categories debe ser un array")
        .default([]),
    body("is_interactive").optional().isBoolean(),
    body("level")
        .isIn(["low", "middle", "high"])
        .withMessage("level debe ser 'low', 'middle' o 'high'"),
    handleInputErrors,
    updateStory
);

router.patch(
    "/:id/toggle",
    requireAuth,
    param("id").isInt().withMessage("ID inválido"),
    handleInputErrors,
    toggleIsInteractive
);

router.delete(
    "/:id",
    requireAuth,
    param("id").isInt().withMessage("ID inválido"),
    handleInputErrors,
    deleteStory
);

export default router