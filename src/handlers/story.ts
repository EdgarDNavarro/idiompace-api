import { Request, Response } from "express";
import Story from "../models/Story.model";
import { paginate } from "../utils/paginate";
import { Op } from "sequelize";

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import axios from "axios";
import OpenAI from "openai";
import Vocabulary from "../models/Vocabulary.Model";
import Exercise from "../models/Exercise.Model";
import SubscriptionUsage from "../models/SubscriptionUsage.Model";
const elevenlabs = new ElevenLabsClient();

const openai = new OpenAI();

export const getStories = async (req: Request, res: Response) => {
    const pagination = (req as any).pagination;
    const { idiom, title, category, voice, my_stories } = req.query;
    try {
        const where: any = {};
        if (idiom) {
            where.idiom = idiom;
        }
        if (voice) {
            where.voice = voice;
        }

        console.log("my_stories value:", my_stories);

        if (my_stories === "true") {
            where.userId = (req as any).session.user.id;
        } else {
            where.userId = {
                [Op.or]: [
                    { [Op.ne]: (req as any).session.user.id },
                    { [Op.is]: null }
                ]
            };
        }


        if (title) {
            where.title = {
                [Op.iLike]: `%${title}%`,
            };
        }
        if (category) {
            where.categories = {
                [Op.contains]: [category], // busca que el array JSONB contenga el valor
            };
        }

        const result = await paginate(
            Story,
            {
                order: [["id", "ASC"]],
                include: ["vocabularies", "exercises"],
                distinct: true,
                where,
            },
            pagination
        );

        res.json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getStoryById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const story = await Story.findByPk(id, {
        include: ["vocabularies", "exercises"],
    });
    if (!story) {
        res.status(404).json({ error: "Story not found" });
        return;
    }
    res.json({ data: story });
};

export const getStoryByVoice = async (req: Request, res: Response) => {
    const { voice, idiom } = req.params;

    const story = await Story.findOne({
        where: { voice, idiom },
        attributes: ["voice", "idiom", "title", "id", "level"],
    });
    if (!story) {
        res.status(404).json({ error: "Story not found" });
        return;
    }
    res.json({ data: story });
};

export const createStory = async (req: Request, res: Response) => {
    try {
        const story = await Story.create(req.body);
        res.status(201).json({ data: story });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: "Invalid story data" });
    }
};

export const updateStory = async (req: Request, res: Response) => {
    const { id } = req.params;
    const story = await Story.findByPk(id);

    if (!story) {
        res.status(404).json({ error: "Story not found" });
        return;
    }

    try {
        await story.update(req.body);
        await story.save();
        res.send("Story updated successfully");
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: "Invalid update data" });
    }
};

export const toggleIsInteractive = async (req: Request, res: Response) => {
    const { id } = req.params;
    const story = await Story.findByPk(id);

    if (!story) {
        res.status(404).json({ error: "Story not found" });
        return;
    }

    story.is_interactive = !story.dataValues.is_interactive;
    await story.save();

    res.json({ data: story });
};

export const deleteStory = async (req: Request, res: Response) => {
    const { id } = req.params;
    const story = await Story.findByPk(id);

    if (!story) {
        res.status(404).json({ error: "Story not found" });
        return;
    }

    await story.destroy();
    res.json({ data: "Story deleted successfully" });
};

export const generateStoryWithIA = async (req: Request, res: Response) => {
    try {
        const { idiom, level, categories, voice_id, voice_name } = req.body;
        const userId = (req as any).session.user.id;

        res.json({ success: true });

        const storyPrompt = `
            Genera una historia en ${idiom} (aproximadamente de 1 minuto y medio de duración al generar el audio con un tts) con el fin de aprender ${idiom}, yo tengo un nivel ${level} de ${idiom} así que la historia tiene que tener este nivel para aprender cosas nuevas pero que no sea imposible de aprender. Estas son las categorias a la que pertenece la historia: ${categories.join(
                    ", "
                )}.

            No agregues secciones aparte de la historia, ni seccion de vocabulario ni nada por el estilo, solo el contenido del texto

            Asegurate que la duracion de la historia sea aproximadamente de 1 minuto y medio al generar el audio con un tts asi que no crees historias muy cortas ni simplemente una conversacion
        `;

        const storyResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: storyPrompt }],
        });

        const storyText = storyResponse.choices[0].message.content?.trim();
        console.log(storyResponse.usage?.total_tokens);

        if (!storyText)
            throw new Error("No se pudo generar el texto de la historia");

        console.log(voice_name, voice_id);

        const parsedIdiom = idiom.toLowerCase();
        const ttsResponse = await elevenlabs.textToSpeech.convertWithTimestamps(
            voice_id,
            {
                text: storyText,
                modelId: "eleven_turbo_v2_5",
                outputFormat: "mp3_44100_128",
                languageCode: parsedIdiom.startsWith("en") ? "en" : "es",
            }
        );

        const { audioBase64, normalizedAlignment } = ttsResponse;
        const {
            characters,
            characterStartTimesSeconds,
            characterEndTimesSeconds,
        } = normalizedAlignment;


        const words: Array<{
            text: string;
            start: number;
            end: number;
            startIdx: number;
            endIdx: number;
        }> = [];

        let currentWordChars: string[] = [];
        let wordStartIdx: number | null = null;

        for (let i = 0; i < characters.length; i++) {
            const ch = characters[i];
            const isSpace = ch === " " || ch === "\n" || ch === "\t";

            if (!isSpace) {
                
                if (currentWordChars.length === 0) wordStartIdx = i;
                currentWordChars.push(ch);
            }

            
            const atLastChar = i === characters.length - 1;
            if ((isSpace || atLastChar) && currentWordChars.length > 0) {
                // si fue el último char y no es espacio, currentWordChars ya tiene el char final incluido
                const startIdx = wordStartIdx ?? 0;
                const endIdx =
                    atLastChar && !isSpace ? i : i - (isSpace ? 1 : 0);
                const wordText = currentWordChars.join("");

                const startTime =
                    characterStartTimesSeconds[startIdx] ??
                    characterStartTimesSeconds[0] ??
                    0;
                const endTime =
                    characterEndTimesSeconds[endIdx] ??
                    characterEndTimesSeconds.at(-1) ??
                    0;

                words.push({
                    text: wordText,
                    start: Number(startTime), // asegurar number simple
                    end: Number(endTime),
                    startIdx,
                    endIdx,
                });

                // reset
                currentWordChars = [];
                wordStartIdx = null;
            }
        }


        const wordTuples = words.map((w) => [
            w.text.replace(/\s+/g, " "),
            Number(w.start),
            Number(w.end),
        ]);

        const formatPrompt = `
            Tengo este texto (en ${idiom}):

            ${storyText}

            Y además tengo la alineación por palabras en formato JSON compacto: una lista de tuplas [word, startSec, endSec].
            Ejemplo del formato (aquí van solo las primeras 10 para referencia; en la llamada real enviarás toda la lista):
            ${JSON.stringify(
                wordTuples.slice(0, 10)
            )} ... (la lista completa está disponible)

            Usa la lista completa de palabras con tiempos (cada tupla tiene la palabra exacta y su tiempo de inicio y fin en segundos) para:
            1) Dividir el texto en frases/párrafos adecuados para aprendizaje con nivel ${level} y traducir la frase para guardar tanto la frase original como la traduccion, para eso hay ambos campos english y spanish.
            2) Para cada frase, calcula startTime = start del primer word de la frase; endTime = end del último word de la frase.
            3) No modifiques el texto de las frases; las frases deben coincidir con fragmentos textuales del storyText.
            4) Devuelve solo un JSON válido con ESTE formato EXACTO (sin comentarios ni texto adicional):

            {
            "title": "string (título breve)",
            "description": "string (una oración corta)",
            "phrases": [
                {
                "english": "string (frase en ingles)",
                "spanish": "string (frase en español)",
                "startTime": 0,
                "endTime": 0
                }
            ]
            }

            Consideraciones:
            - Usa la lista completa de palabras con tiempos para calcular tiempos de las frases (no inventes tiempos).
            - Si una palabra aparece varias veces, mapea en orden de aparición.
            - Mantén la cantidad de frases razonable para ~1:30 de audio (ni muy fragmentado, ni todo en una sola frase).
            - Traduce solo las frases (english -> spanish). No traduzcas el título ni la descripción.
            - Devuelve SOLO el JSON. Nada más.
        `;

        const fullFormatPrompt = `${formatPrompt}\n\nPALABRAS_CON_TIMES:\n${JSON.stringify(
            wordTuples
        )}`;

        const formatResponse2 = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: fullFormatPrompt }],
            temperature: 0.25,
        });

        console.log(formatResponse2.usage?.total_tokens);

        let rawJson = formatResponse2.choices[0].message.content?.trim() ?? "";
        rawJson = rawJson.replace(/^```json|```$/g, "").trim();
        const storyJson = JSON.parse(rawJson);

        // 7) Guardar historia en BD (ya con tiempos)
        const story = await Story.create({
            ...storyJson,
            idiom,
            level,
            categories,
            is_interactive: false,
            voice: voice_name,
            userId
        });

        await axios.post(
            `${process.env.N8N_URL}/webhook/34a5ad60-b730-4a02-8ab7-a1fc2340ceb0`,
            {
                file_name: story.title,
                level,
                base64: audioBase64,
            }
        );

        const vocabPrompt = `
            Del siguiente texto en ${idiom}:
            ${storyText}

            Extrae 10 palabras destacadas con traducción y un ejemplo nuevo.
            Devuelve solo un array JSON con este formato exacto:
            [
                {
                    "vocabulary": "string",
                    "translation": "string",
                    "example": "string",
                    "storyId": ${story.id}
                }
            ]
        `;

        const vocabResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: vocabPrompt }],
            temperature: 0.4,
        });

        let vocabJson = vocabResponse.choices[0].message.content?.trim() ?? "";
        vocabJson = vocabJson.replace(/^```json|```$/g, "").trim();
        const vocabArray = JSON.parse(vocabJson);

        for (const vocab of vocabArray) {
            await Vocabulary.create(vocab);
        }

        const exercisePrompt = `
            Basándote en el siguiente texto en ${idiom}:
            ${storyText}

            Crea 5 ejercicios tipo test, con 4 opciones y una explicación.
            Formato exacto:
            [
                {
                    "question": "string",
                    "optionA": "string",
                    "optionB": "string",
                    "optionC": "string",
                    "optionD": "string",
                    "correctOption": "A" | "B" | "C" | "D",
                    "explanation": "string",
                    "storyId": ${story.id}
                }
            ]
        `;

        const exerciseResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: exercisePrompt }],
            temperature: 0.5,
        });

        let exerciseJson = exerciseResponse.choices[0].message.content?.trim() ?? "";
        exerciseJson = exerciseJson.replace(/^```json|```$/g, "").trim();
        const exerciseArray = JSON.parse(exerciseJson);

        for (const ex of exerciseArray) {
            await Exercise.create(ex);
        }

        console.log(
            "✅ Historia generada y sincronizada usando tiempos por palabra (wordTuples)."
        );
    } catch (error) {
        console.error("❌ Error generating story:", error);
    }
};

export const getUsageByUserId = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const usage = await SubscriptionUsage.findOne({
            where: { userId, status: "active" },
        });

        if (!usage) {
            res.status(404).json({ error: "Usage not found" });
            return;
        }

        res.json({ data: usage });
    } catch (error) {
        console.error("❌ Error generating story:", error);
        res.status(500).json({ error: "Error generating story" });
    }
};

export const addOneUsage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const usage = await SubscriptionUsage.findByPk(id);

        if (!usage) {
            res.status(404).json({ error: "Usage not found" });
            return;
        }

        usage.storiesUsed = usage.storiesUsed + 1;
        await usage.save();

        res.json({ data: usage });
    } catch (error) {
        console.error("❌ Error generating story:", error);
        res.status(500).json({ error: "Error generating story" });
    }
};
