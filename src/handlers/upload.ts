import { Request, Response } from "express";
import OpenAI from "openai";
import {LoadParameters, PDFParse, TextResult} from "pdf-parse";


const openai = new OpenAI();

const MAX_PDF_PAGES = 15;
const MAX_TEXT_LENGTH = 25000;

const FLASHCARD_SYSTEM_PROMPT = `You are a language learning assistant. Extract key vocabulary, idioms, and expressions from the provided content and generate flashcards for language learning, The amount depends on the length of the text..

Each flashcard must have:
- front: the word, phrase, or idiom
- back: its definition or translation in English
- example: a natural sentence using it in context

Respond ONLY with a valid JSON object in this exact format:
{"flashcards": [{"front": "...", "back": "...", "example": "..."}]}`;

function sanitizeText(raw: string): string {
    return raw
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // control chars
        .replace(/[^\w\s.,;:!?'"()\-–—áéíóúÁÉÍÓÚñÑüÜàèìòùâêîôûäëïöü]/g, " ") // non-printable symbols
        .replace(/\s{2,}/g, " ") // collapse multiple spaces
        .replace(/(\r\n|\n|\r)/g, " ") // flatten newlines
        .trim()
        .slice(0, MAX_TEXT_LENGTH);
}

export const generateFlashcardsFromPdf = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: "No se subió ningún archivo PDF" });
            return;
        }

        const parameters: LoadParameters = {
            data: req.file.buffer,
        }
        
        let parser: PDFParse;
        let text: TextResult;
        try {
            parser = new PDFParse(parameters);
            text = await parser.getText();

            
        } catch {
            res.status(400).json({ error: "No se pudo leer el archivo PDF" });
            return;
        }

        if (text.total > MAX_PDF_PAGES) {
            res.status(400).json({
                error: `El PDF tiene ${text.total} páginas. El máximo permitido es ${MAX_PDF_PAGES}.`,
            });
            return;
        }

        const sanitized = sanitizeText(text.text);
        if (!sanitized) {
            res.status(400).json({ error: "No se pudo extraer texto del PDF" });
            return;
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: FLASHCARD_SYSTEM_PROMPT },
                {
                    role: "user",
                    content: `Generate flashcards from this text:\n\n${sanitized}`,
                },
            ],
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content ?? "{}";
        const parsed = JSON.parse(content);
        const flashcards = parsed.flashcards ?? [];

        res.json({ data: flashcards, pages: text.total });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al procesar el PDF" });
    }
};

export const generateFlashcardsFromImage = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: "No se subió ninguna imagen" });
            return;
        }

        const base64 = req.file.buffer.toString("base64");
        const mimeType = req.file.mimetype;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: FLASHCARD_SYSTEM_PROMPT },
                {
                    role: "user",
                    content: [
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:${mimeType};base64,${base64}`,
                                detail: "high",
                            },
                        },
                        {
                            type: "text",
                            text: "Generate flashcards from the vocabulary, text, or idioms visible in this image.",
                        },
                    ],
                },
            ],
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content ?? "{}";
        const parsed = JSON.parse(content);
        const flashcards = parsed.flashcards ?? [];

        res.json({ data: flashcards });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al procesar la imagen" });
    }
};
