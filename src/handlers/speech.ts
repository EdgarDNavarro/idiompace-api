import { Request, Response } from "express";
import OpenAI from "openai";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import WebSocket from "ws";
import crypto from "crypto";

const TTS_MODEL = "eleven_flash_v2_5";

const elevenlabs = new ElevenLabsClient();
const openai = new OpenAI();

// Historial de conversación por sesión
const sessions = new Map();

// ── Quota tracking (en memoria, por día) ─────────────────────────────────────
const DAILY_QUOTA_MINUTES = 5;   // minutos totales de llamada por día por usuario
const MAX_CALL_SECONDS    = 180; // máximo por llamada individual (3 min)

interface UserQuota  { minutesUsed: number; date: string; }
interface SessionInfo { userId: string; }

const userQuotas    = new Map<string, UserQuota>();
const activeSessions = new Map<string, SessionInfo>();

function getUserQuota(userId: string): UserQuota {
    const today = new Date().toISOString().split("T")[0];
    const stored = userQuotas.get(userId);
    if (!stored || stored.date !== today) {
        const fresh = { minutesUsed: 0, date: today };
        userQuotas.set(userId, fresh);
        return fresh;
    }
    return stored;
}

// POST /speech/session/start — verifica cuota, obtiene token Scribe y registra sesión
export const startSession = async (req: Request, res: Response) => {
    const userId = (req as any).session?.user?.id;
    if (!userId) { res.status(400).json({ error: "Sin sesión de usuario" }); return; }

    const quota          = getUserQuota(userId);
    const minutesRemaining = Math.max(0, DAILY_QUOTA_MINUTES - quota.minutesUsed);

    if (minutesRemaining <= 0) {
        res.status(429).json({
            error: "Has alcanzado el límite diario de llamadas. Vuelve mañana.",
            minutesRemaining: 0,
            maxMinutes: DAILY_QUOTA_MINUTES,
        });
        return;
    }

    try {
        const tokenResponse = await elevenlabs.tokens.singleUse.create("realtime_scribe");
        const token = typeof tokenResponse === "string"
            ? tokenResponse
            : (tokenResponse as any).token ?? tokenResponse;

        const sessionId = crypto.randomUUID();
        activeSessions.set(sessionId, { userId });

        res.json({
            sessionId,
            token,
            allowedSeconds : Math.min(minutesRemaining * 60, MAX_CALL_SECONDS),
            minutesRemaining,
            maxMinutes: DAILY_QUOTA_MINUTES,
        });
    } catch (err) {
        console.error("[startSession]", err);
        res.status(500).json({ error: "No se pudo iniciar la sesión" });
    }
};

// POST /speech/session/end — registra duración real y libera cuota consumida
export const endSession = async (req: Request, res: Response) => {
    const userId = (req as any).session?.user?.id;
    const { sessionId, durationSeconds } = req.body;

    if (!sessionId || typeof durationSeconds !== "number") {
        res.status(400).json({ error: "Faltan campos: sessionId, durationSeconds" });
        return;
    }

    const info = activeSessions.get(sessionId);
    if (info && info.userId === userId) {
        const minutesUsed = durationSeconds / 60;
        const quota = getUserQuota(userId);
        quota.minutesUsed = Math.min(quota.minutesUsed + minutesUsed, DAILY_QUOTA_MINUTES);
        userQuotas.set(userId, quota);
        activeSessions.delete(sessionId);
    }

    sessions.delete(sessionId);
    res.json({ ok: true });
};

// GET /speech/quota — devuelve cuota del usuario para mostrar en la UI
export const getQuota = async (req: Request, res: Response) => {
    const userId = (req as any).session?.user?.id;
    if (!userId) { res.status(400).json({ error: "Sin sesión de usuario" }); return; }

    const quota          = getUserQuota(userId);
    const minutesRemaining = Math.max(0, DAILY_QUOTA_MINUTES - quota.minutesUsed);

    res.json({
        minutesUsed: parseFloat(quota.minutesUsed.toFixed(1)),
        minutesRemaining: parseFloat(minutesRemaining.toFixed(1)),
        maxMinutes: DAILY_QUOTA_MINUTES,
        canCall: minutesRemaining > 0,
    });
};

// Perfiles de personalidad para cada voz
const voicePersonalities: Record<string, { name: string; personality: string }> = {
    // Rachel - Universal (English & Spanish)
    "21m00Tcm4TlvDq8ikWAM": {
        name: "Rachel",
        personality: "You are warm and encouraging, like a supportive friend."
    },
    // David Martin - Spanish
    "Nh2zY9kknu6z4pZy6FhD": {
        name: "David",
        personality: "You are energetic with great humor. You make learning fun."
    },
    // Abel Lz - British/Standard
    "452WrNT9o8dphaYW5YGU": {
        name: "Abel",
        personality: "You are sophisticated with refined British charm."
    },
    // George - British
    "JBFqnCBsd6RMkjVDRZzb": {
        name: "George",
        personality: "You are witty with dry British humor."
    },
    // Jessica - American
    "cgSgspJ2msm6clMCkdW9": {
        name: "Jessica",
        personality: "You are bubbly and optimistic with infectious enthusiasm."
    },
    // Miguel - American/Standard
    "k8cFOyAg7B9qwBlDDNTC": {
        name: "Miguel",
        personality: "You are calm and methodical, like a trusted mentor."
    },
    // Heisenberg - American
    "iEBOK9alpKauGRvBSsFi": {
        name: "Walter",
        personality: "You are precise with a scientific approach to language."
    },
    // Jon - American
    "MFZUKuGQUsGJPQjTS4wC": {
        name: "Jon",
        personality: "You are laid-back and casual, using modern slang."
    },
    // Trinity - American
    "2qfp6zPuviqeCOZIE9RZ": {
        name: "Trinity",
        personality: "You are sharp and confident, like a determined coach."
    },
    // Lumina - Colombian
    "x5IDPSl4ZUbhosMmVFTk": {
        name: "Lumina",
        personality: "You are vibrant with Colombian warmth and passion."
    },
    // Aitana - Peninsular Spanish
    "AxFLn9byyiDbMn5fmyqu": {
        name: "Aitana",
        personality: "You are elegant with authentic Spanish charm."
    }
};


// Generar flashcards del historial de conversación
export const generateFlashcards = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        
        if (!sessions.has(sessionId)) {
            return res.status(404).json({ error: "Sesión no encontrada" });
        }

        const history = sessions.get(sessionId);
        
        if (history.length === 0) {
            return res.json([]);
        }

        // Pedir a OpenAI que genere flashcards del historial
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.7,
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: `You are a language learning assistant. Analyze the conversation history and generate flashcards for the most important vocabulary, phrases, or grammar points discussed.

Rules:
- Generate 3-8 flashcards maximum (only the most valuable content)
- Each flashcard must have:
  * front: The word/phrase in the target language
  * back: Translation or explanation
  * example: A sentence using the word/phrase in context from the conversation (or create a relevant one)
- Focus on new vocabulary, corrections made, or key phrases discussed
- If no valuable learning content found, return empty array
- Return ONLY valid JSON in this exact format: {"flashcards": [{"front": "...", "back": "...", "example": "..."}]}`
                },
                {
                    role: "user",
                    content: `Conversation history:\n${JSON.stringify(history, null, 2)}\n\nGenerate flashcards from this conversation.`
                }
            ]
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            return res.json([]);
        }

        const result = JSON.parse(content);
        res.json(result.flashcards || []);

    } catch (error: any) {
        console.error("[generateFlashcards] Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Limpiar sesión de chat
export const clearChatSession = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        sessions.delete(sessionId);
        res.json({ ok: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getScribeToken = async (req: Request, res: Response) => {
    try {
        const token = await elevenlabs.tokens.singleUse.create("realtime_scribe");
        res.json(token);
    } catch (err) {
        console.error("[scribe-token] Error:", err);
        res.status(500).json({ error: "No se pudo generar el token" });
    }
};

export const wsChat = async (req: Request, res: Response) => {
    const { text, sessionId, voiceId, idiom } = req.body;
    const userId = (req as any).session?.user?.id;

    if (!text || !sessionId || !voiceId || !idiom) {
        return res.status(400).json({ error: "Faltan campos: text, sessionId, voiceId, idiom" });
    }

    // Validar que la sesión fue registrada y pertenece a este usuario
    const sessionOwner = activeSessions.get(sessionId);
    if (!sessionOwner || sessionOwner.userId !== userId) {
        return res.status(403).json({ error: "Sesión inválida. Inicia una llamada desde la app." });
    }

    // Inicializar historial si es sesión nueva
    if (!sessions.has(sessionId)) {
        sessions.set(sessionId, []);
    }
    const history = sessions.get(sessionId);
    history.push({ role: "user", content: text });

    // Headers para streaming de audio
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");

    // ── Abrir WebSocket TTS con ElevenLabs ──────
    const ttsWs = new WebSocket(
        `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=${TTS_MODEL}`,
        { headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY } }
    );

    let ttsReady = false;
    let pendingChunks = []; // Buffer por si Claude llega antes de que WS esté listo
    let fullResponse = "";

    // Cuando el WS TTS está listo → configurar voz
    ttsWs.on("open", () => {
        ttsReady = true;

        ttsWs.send(JSON.stringify({
        text: " ", // mensaje de inicialización requerido por ElevenLabs
        voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            use_speaker_boost: false,
            speed: 0.9, // Ligeramente más lento, mejor para aprender
        },
        generation_config: {
            chunk_length_schedule: [50, 120, 160, 250], // Latencia baja para conversación
        },
        }));

        // Vaciar buffer si Claude ya envió texto antes de que el WS estuviese listo
        for (const chunk of pendingChunks) {
        ttsWs.send(JSON.stringify({ text: chunk, flush: true }));
        }
        pendingChunks = [];
    });

    // Audio de ElevenLabs → pipe directo al cliente
    ttsWs.on("message", (event) => {
        try {
        const data = JSON.parse(event.toString());

        if (data.audio) {
            const audioBuffer = Buffer.from(data.audio, "base64");
            res.write(audioBuffer);
        }

        if (data.isFinal) {
            res.end();
        }
        } catch (err) {
        console.error("[TTS WS] Error parsing message:", err);
        }
    });

    ttsWs.on("error", (err) => {
        console.error("[TTS WS] Error:", err);
        if (!res.writableEnded) res.end();
    });

    ttsWs.on("close", () => {
        if (!res.writableEnded) res.end();
    });

    // ── OpenAI genera la respuesta en streaming ──
    try {
        // Obtener personalidad basada en el voiceId
        const voiceProfile = voicePersonalities[voiceId] || {
            name: "Teacher",
            personality: "You are a friendly and patient teacher."
        };

        const stream = await openai.chat.completions.create({
            model: "gpt-4.1-nano",
            max_tokens: 250, // Respuestas cortas → conversación más natural
            messages: [
                {
                    role: "system",
                    content: `Your name is ${voiceProfile.name}. ${voiceProfile.personality}

                    You are a ${idiom} teacher helping students practice conversation.
                    - Always respond in ${idiom}, regardless of what language the student uses.
                    - Keep your responses SHORT: maximum 2-3 sentences, like a real conversation.
                    - You can give slightly longer answers if the student wants you to explain a topic.
                    - If the student makes a grammar or vocabulary mistake, correct it naturally within your response without interrupting the flow.
                    - Be encouraging. Ask a follow-up question at the end to keep the conversation going.
                    - Adapt your vocabulary to the student's apparent level.
                    - Stay true to your personality in every response.`
                },
                ...history
            ],
            stream: true,
        });

        let sentenceBuffer = "";

        // Enviar a ElevenLabs frase por frase según va llegando el texto
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            
            sentenceBuffer += content;
            fullResponse += content;

            // Detectar fin de frase → mandar a TTS inmediatamente
            const sentenceEnd = sentenceBuffer.search(/[.!?]\s/);
            if (sentenceEnd !== -1) {
                const sentence = sentenceBuffer.slice(0, sentenceEnd + 1).trim();
                sentenceBuffer = sentenceBuffer.slice(sentenceEnd + 2);

                if (sentence) {
                    if (ttsReady) {
                        ttsWs.send(JSON.stringify({ text: sentence + " ", flush: true }));
                    } else {
                        pendingChunks.push(sentence + " ");
                    }
                }
            }
        }

        // Enviar lo que quede en el buffer
        if (sentenceBuffer.trim()) {
            if (ttsReady) {
                ttsWs.send(JSON.stringify({ text: sentenceBuffer.trim(), flush: true }));
            } else {
                pendingChunks.push(sentenceBuffer.trim());
            }
        }

        // Guardar respuesta completa en el historial
        history.push({ role: "assistant", content: fullResponse });

        // Cerrar el WS TTS → dispara isFinal en ElevenLabs
        ttsWs.send(JSON.stringify({ text: "" }));

    } catch (err) {
        console.error("[chat] Error iniciando OpenAI:", err);
        ttsWs.close();
        if (!res.writableEnded) res.status(500).end();
    }
}