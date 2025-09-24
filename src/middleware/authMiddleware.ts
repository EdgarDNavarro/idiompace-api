// middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
        res.status(401).json({ error: "No autorizado" });
        return
    }

    // Guardamos la sesión para usarla en el controlador
    (req as any).session = session;
    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(500).json({ error: "Error en la autenticación" });
  }
}
