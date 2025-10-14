import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import { body } from "express-validator";
import {
    getStreak,
    createStreak,
    updateStreak,
    resetStreak
} from "../handlers/streak";
import { handleInputErrors } from "../middleware";

const router = Router();

router.get(
    "/",
    requireAuth,
    handleInputErrors,
    getStreak
);

router.post(
    "/",
    requireAuth,
    handleInputErrors,
    createStreak
);

router.put(
    "/",
    requireAuth,
    body("currentStreak").optional().isInt({ min: 0 }).withMessage("currentStreak debe ser un número entero mayor o igual a 0"),
    body("longestStreak").optional().isInt({ min: 0 }).withMessage("longestStreak debe ser un número entero mayor o igual a 0"),
    handleInputErrors,
    updateStreak
);

router.post(
    "/reset",
    requireAuth,
    handleInputErrors,
    resetStreak
);

export default router;