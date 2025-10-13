import { Router } from "express";
import { body, param, query } from "express-validator";
import {
    createExercise,
    getExercises,
    updateExercise,
    deleteExercise
} from "../handlers/exercise";
import { handleInputErrors } from "../middleware";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

// Listar ejercicios (puedes filtrar por storyId)
router.get(
    "/",
    requireAuth,
    query("storyId").optional().isInt().withMessage("storyId debe ser un número entero"),
    handleInputErrors,
    getExercises
);

// Crear ejercicio
router.post(
    "/",
    requireAuth,
    body("question").notEmpty().withMessage("El campo 'question' es obligatorio"),
    body("optionA").notEmpty().withMessage("El campo 'optionA' es obligatorio"),
    body("optionB").notEmpty().withMessage("El campo 'optionB' es obligatorio"),
    body("optionC").notEmpty().withMessage("El campo 'optionC' es obligatorio"),
    body("optionD").notEmpty().withMessage("El campo 'optionD' es obligatorio"),
    body("correctOption").isIn(["A", "B", "C", "D"]).withMessage("El campo 'correctOption' debe ser 'A', 'B', 'C' o 'D'"),
    body("explanation").notEmpty().withMessage("El campo 'explanation' es obligatorio"),
    body("storyId").isInt().withMessage("El campo 'storyId' debe ser un número entero"),
    handleInputErrors,
    createExercise
);

// Actualizar ejercicio
router.put(
    "/:id",
    requireAuth,
    param("id").isInt().withMessage("ID inválido"),
    body("question").notEmpty().withMessage("El campo 'question' es obligatorio"),
    body("optionA").notEmpty().withMessage("El campo 'optionA' es obligatorio"),
    body("optionB").notEmpty().withMessage("El campo 'optionB' es obligatorio"),
    body("optionC").notEmpty().withMessage("El campo 'optionC' es obligatorio"),
    body("optionD").notEmpty().withMessage("El campo 'optionD' es obligatorio"),
    body("correctOption").isIn(["A", "B", "C", "D"]).withMessage("El campo 'correctOption' debe ser 'A', 'B', 'C' o 'D'"),
    body("explanation").notEmpty().withMessage("El campo 'explanation' es obligatorio"),
    body("storyId").isInt().withMessage("El campo 'storyId' debe ser un número entero"),
    handleInputErrors,
    updateExercise
);

// Eliminar ejercicio
router.delete(
    "/:id",
    requireAuth,
    param("id").isInt().withMessage("ID inválido"),
    handleInputErrors,
    deleteExercise
);

export default router;