import { Request, Response } from "express";
import OpenAI from "openai";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
// import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import WebSocket from "ws";

const TTS_MODEL = "eleven_flash_v2_5";    // Modelo de baja latencia

const elevenlabs = new ElevenLabsClient();

const openai = new OpenAI();

// Historial de conversación por sesión
// const conversationHistory = new Map<string, Array<ChatCompletionMessageParam>>(); 
const sessions = new Map();


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

    if (!text || !sessionId || !voiceId || !idiom) {
        return res.status(400).json({ error: "Faltan campos: text, sessionId, voiceId, idiom" });
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
        const stream = await openai.chat.completions.create({
            model: "gpt-4.1-nano",
            max_tokens: 250, // Respuestas cortas → conversación más natural
            messages: [
                {
                    role: "system",
                    content: `You are a friendly and patient native ${idiom} teacher.
    - Always respond in ${idiom}, regardless of what language the student uses.
    - Keep your responses SHORT: maximum 2-3 sentences, like a real conversation.
    - You can give slightly longer answers if the student wants you to explain a topic.
    - If the student makes a grammar or vocabulary mistake, correct it naturally within your response without interrupting the flow.
    - Be encouraging. Ask a follow-up question at the end to keep the conversation going.
    - Adapt your vocabulary to the student's apparent level.
    `
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