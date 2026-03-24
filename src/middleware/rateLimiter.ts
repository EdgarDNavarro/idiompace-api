import rateLimit from "express-rate-limit";

// Rate limiter global - protección básica general
export const globalLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 100, // 100 requests por IP cada 5 minutos
    message: "Demasiadas peticiones desde esta IP, intenta de nuevo más tarde",
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter para generación de historias con IA - MUY restrictivo
export const storyAILimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 5, // Solo 5 historias por hora por IP
    message: "Límite de generación de historias alcanzado. Intenta de nuevo en 1 hora",
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false, // Cuenta incluso si la request falla
});

// Rate limiter para obtener token de Scribe - moderado
export const scribeTokenLimiter = rateLimit({
    windowMs: 3 * 60 * 1000, // 3 minutos
    max: 3, // 3 tokens por cada 3 minutos 
    message: "Límite de tokens alcanzado. Intenta de nuevo más tarde",
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter para chat con streaming - permisivo pero controlado
export const chatStreamLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 150, // 150 mensajes cada 15 minutos (permite conversación fluida)
    message: "Demasiados mensajes en poco tiempo. Espera un momento antes de continuar",
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter para login/signup - prevenir brute force
export const authSignInLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 intentos de login/registro cada 15 minutos
    message: "Demasiados intentos de inicio de sesión. Intenta de nuevo más tarde",
    standardHeaders: true,
    legacyHeaders: false
});
