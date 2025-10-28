import { Request, Response } from 'express';
import Story from '../models/Story.model';
import { paginate } from '../utils/paginate';
import { Op } from 'sequelize';

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import axios from "axios";
import OpenAI from "openai";
import Vocabulary from "../models/Vocabulary.Model";
import Exercise from "../models/Exercise.Model";
const elevenlabs = new ElevenLabsClient();

const openai = new OpenAI();

export const getStories = async (req: Request, res: Response) => {
  const pagination = (req as any).pagination;
  const { idiom, title, category } = req.query;
  try {
    const where: any = {};
    if (idiom) {
      where.idiom = idiom;
    }
    if (title) {
      where.title = {
        [Op.iLike]: `%${title}%`
      };
    }
    if (category) {
      where.categories = {
        [Op.contains]: [category]  // busca que el array JSONB contenga el valor
      };
    }

    const result = await paginate(
      Story,
      {
        order: [['id', 'ASC']],
        include: ['vocabularies', 'exercises'],
        distinct: true,
        where,
      },
      pagination
    );

    res.json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getStoryById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const story = await Story.findByPk(id, {
    include: ['vocabularies', 'exercises']
  });
  if (!story) {
    res.status(404).json({ error: 'Story not found' });
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
    res.status(400).json({ error: 'Invalid story data' });
  }
};

export const updateStory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const story = await Story.findByPk(id);

  if (!story) {
    res.status(404).json({ error: 'Story not found' });
    return;
  }

  try {
    await story.update(req.body);
    await story.save();
    res.send("Story updated successfully");
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Invalid update data' });
  }
};

export const toggleIsInteractive = async (req: Request, res: Response) => {
  const { id } = req.params;
  const story = await Story.findByPk(id);

  if (!story) {
    res.status(404).json({ error: 'Story not found' });
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
    res.status(404).json({ error: 'Story not found' });
    return;
  }

  await story.destroy();
  res.json({ data: 'Story deleted successfully' });
};

export const generateStoryWithIA = async (req: Request, res: Response) => {
    try {
        const { idiom, level, categories, voice_id, voice_name } = req.body;

        res.json({
            success: true
        });

        const storyPrompt = `
            Genera un texto corto en ${idiom} (aproximadamente de 2 minuto de duración al generar el audio con un tts) con el fin de aprender ${idiom}, yo tengo un nivel ${level} de ${idiom} así que la historia tiene que tener este nivel para aprender cosas nuevas pero que no sea imposible de aprender. Estas son las categorias a la que pertenece la historia: ${categories.join(", ")}.

            No agregues secciones aparte de la historia, ni seccion de vocabulario ni nada por el estilo, solo el contenido del texto
        `;

        const storyResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: storyPrompt }],
        });

        const storyText = storyResponse.choices[0].message.content?.trim();
        
        const formatPrompt = `
Texto de historia generado:
${storyText}

Transforma este texto en un JSON con el formato siguiente (no uses \`\`\`, ni texto adicional fuera del JSON):

{
  "title": "string",
  "description": "string",
  "phrases": [
    {
      "english": "string",
      "spanish": "string",
      "startTime": 0,
      "endTime": 0
    }
  ]
}

Traduce solo las frases (no el título ni la descripción). No incluyas explicación ni texto fuera del JSON. en el contenido de cada frase solo utiliza texto plano (string) no utilices adornos del texto, ni nada para resaltar como negritas o cursivas
`;

        const formatResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: formatPrompt }],
            temperature: 0.3
        });

        let rawJson = formatResponse.choices[0].message.content?.trim() ?? "";
        rawJson = rawJson.replace(/^```json|```$/g, "").trim();

        const storyJson = JSON.parse(rawJson);
        
        let cumulativeTime = 0;
        const requestIds: string[] = [];
        const audioBuffers: Buffer[] = [];

        const parsedIdiom = idiom.toLowerCase();

        for (const phrase of storyJson.phrases) {

            let idiomPhrase = phrase.english

            if (!parsedIdiom.startsWith("en")) {
                idiomPhrase = phrase.spanish
            }
            const response = await elevenlabs.textToSpeech.convertWithTimestamps(
                // "452WrNT9o8dphaYW5YGU", // tu voice_id
                voice_id,
                {
                    text: idiomPhrase,
                    modelId: "eleven_multilingual_v2",
                    outputFormat: "mp3_44100_128",
                    previousRequestIds: requestIds.slice(-3),
                    languageCode: parsedIdiom.startsWith("en") ? "en" : "es",
                }
            ).withRawResponse();
            const audioData = response.data;
            requestIds.push(response.rawResponse.headers.get("request-id") ?? "");

            const { characterEndTimesSeconds } = audioData.alignment;
            const duration =
                characterEndTimesSeconds[characterEndTimesSeconds.length - 1] ?? 0;

            phrase.startTime = Math.floor(cumulativeTime);
            phrase.endTime = Math.ceil(cumulativeTime + duration);
            cumulativeTime += duration;

            const audioBuffer = Buffer.from(audioData.audioBase64, "base64");
            audioBuffers.push(audioBuffer);
        }

        const combinedBuffer = Buffer.concat(audioBuffers);

        const combinedBase64 = combinedBuffer.toString("base64");

        const story = await Story.create({
            ...storyJson,
            idiom,
            level,
            categories,
            is_interactive: false,
            voice: voice_name
        });

        await axios.post(`${process.env.N8N_URL}/webhook/34a5ad60-b730-4a02-8ab7-a1fc2340ceb0`, {
            file_name: story.title,
            level,
            base64: combinedBase64
        })

        const vocabPrompt = `
            Del siguiente texto en ${idiom}:
            ${storyText}

            y extrae vocabulario para mostrarle una lista al usuario antes de que escuche el audio de esas frases y pueda tener mas contexto y entender mas del audio

            Asi que extrae el vocabulario mas resaltante, el menos probable que el usuario conozca y el que este mas relacionado a la historia

            Tiene que tener la traducción e inventar un ejemplo diferente del de la frase que lo sacaste. 

            Esto es a modo de aprender ${idiom} y vocabulario, asi que vocabulary y example siempre son en ${idiom}. 

            Genera un array de 10 objetos JSON con este formato exacto:
            [
            {
                "vocabulary": "string",
                "translation": "string",
                "example": "string",
                "storyId": ${story.id}
            }
            ]


            Asegúrate de devolver solo el JSON, sin comentarios ni explicaciones.
        `;

        const vocabResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: vocabPrompt }],
            temperature: 0.4
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

            y crea 5 ejercicios con la funcionalidad de aprender el idioma ${idiom}.

            Genera un array de 5 ejercicios JSON con este formato exacto:
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

            cada ejercicio tiene que ser una pregunta diferente sobre la historia que se esta contando, la idea es aprender el idioma y desarrollar la comprension y el listening asi que tienen que ser preguntas directas de que paso en la historia 

            tienen que ser 4 opciones ( A, B, C y D) para cada pregunta (obviamente solo una correcta) y una explicacion de por que es esa la opcion correcta

            Las opciones no tienen que ser tan obvios, pueden ser un poco trickies, es decir, que sean parecidas para que solo pueda responder correctamente si se presta atencion y tiene la suficiente comprension. Que las opciones tengan solamnete pequeñas variaciones una de la otra

            Entonces las opciones del ejercicios sean muy parecidas con leves cambios, puede ser cambiando solamente el sustantivo, cambiando solamnte la conjugacion del verbo, cambiando solamente un adjetivo, cambiando solamente un advervio etc

            a todos colocales el storyId ${story.id}, sin excesiones
            
            Solo devuelve el JSON válido, sin explicaciones ni texto fuera del array.
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

    } catch (error) {
        console.error("❌ Error generating story:", error);
    }
};