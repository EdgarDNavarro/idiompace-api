// middlewares/authMiddleware.ts — Hackathon: sesión anónima por UUID en cookie
import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    let userId = (req as any).cookies?.["anon_id"];

    if (!userId) {
        userId = crypto.randomUUID();
        res.cookie("anon_id", userId, {
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
        });
    }

    (req as any).session = { user: { id: userId } };
    next();
}
