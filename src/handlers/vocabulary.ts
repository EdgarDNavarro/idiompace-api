import { Request, Response } from 'express';
import Vocabulary from "../models/Vocabulary.Model";

// Crear vocabulario
export const createVocabulary = async (req: Request, res: Response) => {
    try {
        const vocab = await Vocabulary.create(req.body);
        res.status(201).json({ data: vocab });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Listar vocabularios (puedes filtrar por storyId)
export const getVocabularies = async (req: Request, res: Response) => {
    try {
        const { storyId } = req.query;
        const where = storyId ? { storyId } : undefined;
        const vocabularies = await Vocabulary.findAll({ where });
        res.json({ data: vocabularies });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Actualizar vocabulario
export const updateVocabulary = async (req: Request, res: Response) => {
    try {
        const vocab = await Vocabulary.findByPk(req.params.id);
        if (!vocab) {
            res.status(404).json({ error: "Vocabulary not found" });
            return;
        }
        await vocab.update(req.body);
        await vocab.save();
        res.json({ data: vocab });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Eliminar vocabulario
export const deleteVocabulary = async (req: Request, res: Response) => {
    try {
        const vocab = await Vocabulary.findByPk(req.params.id);
        if (!vocab) {
            res.status(404).json({ error: "Vocabulary not found" });
            return;
        }
        await vocab.destroy();
        res.send("Vocabulary deleted successfully");
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
