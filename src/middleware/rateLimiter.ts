import rateLimit from "express-rate-limit";
import { Request } from "express";

// Key generator: usa el UUID de cookie anónima, cae a IP si no existe aún
const cookieKey = (req: Request) =>
    (req as any).cookies?.["anon_id"] ?? req.ip ?? "unknown";

// Rate limiter global - protección básica general
export const globalLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 200,
    message: "Demasiadas peticiones, intenta de nuevo más tarde",
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: cookieKey,
    validate: { keyGeneratorIpFallback: false },
});

// Rate limiter para generación de historias con IA - MUY restrictivo
export const storyAILimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // 3 historias por hora por usuario
    message: "Límite de generación de historias alcanzado. Intenta de nuevo en 1 hora",
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    keyGenerator: cookieKey,
    validate: { keyGeneratorIpFallback: false },
});

// Rate limiter para obtener token de Scribe - moderado
export const scribeTokenLimiter = rateLimit({
    windowMs: 3 * 60 * 1000, // 3 minutos
    max: 3,
    message: "Límite de tokens alcanzado. Intenta de nuevo más tarde",
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: cookieKey,
    validate: { keyGeneratorIpFallback: false },
});

// Rate limiter para chat con streaming — 20 mensajes por 15 min por usuario
export const chatStreamLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 20,
    message: "Demasiados mensajes en poco tiempo. Espera unos minutos antes de continuar",
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: cookieKey,
    validate: { keyGeneratorIpFallback: false },
});

// Rate limiter para upload de PDF - 5 por día por usuario
export const uploadPdfLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 horas
    max: 5,
    message: "Límite de PDFs alcanzado. Puedes subir 5 PDFs por día",
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: cookieKey,
    validate: { keyGeneratorIpFallback: false },
});

// Rate limiter para upload de imágenes - 5 por día por usuario
export const uploadImageLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 horas
    max: 5,
    message: "Límite de imágenes alcanzado. Puedes subir 5 imágenes por día",
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: cookieKey,
    validate: { keyGeneratorIpFallback: false },
});
