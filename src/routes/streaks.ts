import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { body } from "express-validator";
import {
    getStreak,
    createStreak,
    updateStreak,
    resetStreak
} from "../handlers/streak.js";
import { handleInputErrors } from "../middleware/index.js";

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