import { Router } from "express";
import { body, param, query } from "express-validator";
import {
    createTest,
    deleteTest,
    getTests,
    updateTest
} from "../handlers/test";
import { handleInputErrors } from "../middleware";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

// Obtener todos los tests o filtrar por storyId
router.get(
    "/:storyId",
    requireAuth,
    param("storyId").notEmpty().isInt().withMessage("storyId debe ser un número entero"),
    handleInputErrors,
    getTests
);

// Crear un test
router.post(
    "/",
    requireAuth,
    body("ask").notEmpty().withMessage("El campo 'ask' es obligatorio"),
    body("answer").notEmpty().withMessage("El campo 'answer' es obligatorio"),
    body("phrase").notEmpty().withMessage("El campo 'phrase' es obligatorio"),
    body("storyId").isInt().withMessage("El campo 'storyId' debe ser un número entero"),
    handleInputErrors,
    createTest
);

// Actualizar un test
router.put(
    "/:id",
    requireAuth,
    param("id").isInt().withMessage("ID inválido"),
    body("ask").notEmpty().withMessage("El campo 'ask' es obligatorio"),
    body("answer").notEmpty().withMessage("El campo 'answer' es obligatorio"),
    body("phrase").notEmpty().withMessage("El campo 'phrase' es obligatorio"),
    body("storyId").isInt().withMessage("El campo 'storyId' debe ser un número entero"),
    handleInputErrors,
    updateTest
);

// Eliminar un test
router.delete(
    "/:id",
    requireAuth,
    param("id").isInt().withMessage("ID inválido"),
    handleInputErrors,
    deleteTest
);

export default router;