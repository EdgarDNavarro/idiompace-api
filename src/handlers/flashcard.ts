import { Request, Response } from "express";
import Flashcards from "../models/Flashcards.model";
import { Op } from "sequelize";

// Crear una flashcard
export const createFlashcard = async (req: Request, res: Response) => {
    try {
        const flashcardData = {
            ...req.body,
            userId: (req as any).session.user.id
        }
        const flashcard = await Flashcards.create(flashcardData);
        res.status(201).json({ data: flashcard });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Listar flashcards por userId
export const getFlashcards = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).session.user.id;
        if (!userId) {
            res.status(400).json({ error: "userId es requerido" });
            return
        }
        const flashcards = await Flashcards.findAll({ where: { userId } });
        res.json({ data: flashcards });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Listar flashcards a estudiar
export const getDueFlashcards = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).session.user.id;
        if (!userId) {
            res.status(400).json({ error: "userId es requerido" });
            return
        }
        const flashcards = await Flashcards.findAll({
            where: {
                userId,
                    [Op.or]: [
                        { nextReviewAt: { [Op.lte]: new Date() } },
                        { nextReviewAt: { [Op.is]: null } }, // 👈 incluir nuevas
                    ] // tarjetas "vencidas"
            },
            order: [['failCount', 'DESC']], // prioriza las más falladas
        });
        res.json({ data: flashcards });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Editar una flashcard
export const updateFlashcard = async (req: Request, res: Response) => {
    try {
        const flashcard = await Flashcards.findByPk(req.params.id);
        if (!flashcard) {
            res.status(404).json({ error: "Flashcard no encontrada" });
            return
        }
        await flashcard.update(req.body);
        await flashcard.save();
        res.json({ data: flashcard });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Eliminar una flashcard
export const deleteFlashcard = async (req: Request, res: Response) => {
    try {
        const flashcard = await Flashcards.findByPk(req.params.id);
        if (!flashcard) {
            res.status(404).json({ error: "Flashcard no encontrada" });
            return
        }
        await flashcard.destroy();
        res.json({ message: "Flashcard eliminada correctamente" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const markCorrect = async (req: Request, res: Response) => {
    try {
        const card = await Flashcards.findByPk(req.params.id);
        if (!card) {
            res.status(404).json({ error: "Flashcard no encontrada" });
            return
        }
        card.successCount += 1;
        card.lastReviewedAt = new Date();
    
        // aumentar la facilidad un poco
        card.easiness = Math.min(card.easiness + 0.1, 3.0);
    
        // duplicar el intervalo (1 → 2 → 4 → 8…)
        card.interval = Math.round(card.interval * card.easiness);
    
        // programar la próxima revisión
        const next = new Date();
        next.setDate(next.getDate() + Math.round(card.interval));
        card.nextReviewAt = next;
    
        await card.save();
    
        res.sendStatus(200);
    } catch (error) {
        console.log(error);
        
    }
}

export const markWrong = async (req: Request, res: Response) => {
    try {
        const card = await Flashcards.findByPk(req.params.id);
        if (!card) {
            res.status(404).json({ error: "Flashcard no encontrada" });
            return
        }
        card.failCount += 1;
        card.lastReviewedAt = new Date();

        // reducir la facilidad
        card.easiness = Math.max(card.easiness - 0.2, 1.3);

        // resetear el intervalo
        card.interval = 1;

        // próxima revisión = mañana
        const next = new Date();
        next.setDate(next.getDate() + 1);
        card.nextReviewAt = next;

        await card.save();
    
        res.sendStatus(200);
    } catch (error) {
        console.log(error);
    }
}