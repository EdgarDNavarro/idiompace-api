import { Request, Response } from "express";
import Streak from "../models/Streak.Model.js";

const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

export const getStreak = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).session?.user?.id;
        if (!userId) {
            res.status(400).json({ error: "userId es requerido" });
            return
        }
        const streak = await Streak.findOne({ where: { userId } });
        if (!streak) {
            res.status(404).json({ error: "Streak no encontrada" });
            return
        }
        res.json({ data: streak });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Incrementa la racha si aún no se hizo hoy. Crea la racha si no existe.
export const incrementStreak = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).session?.user?.id;
        if (!userId) {
            res.status(400).json({ error: "userId es requerido" });
            return;
        }

        let streak = await Streak.findOne({ where: { userId } });

        if (!streak) {
            streak = await Streak.create({ userId, currentStreak: 0, longestStreak: 0 });
        }

        const today = new Date();
        const lastUpdated = new Date((streak as any).updatedAt);
        const alreadyToday = isSameDay(lastUpdated, today);

        // Brand-new streak (currentStreak=0, longestStreak=0): siempre permitir el primer incremento
        const isNeverIncremented = streak.currentStreak === 0 && streak.longestStreak === 0;

        if (alreadyToday && !isNeverIncremented) {
            res.json({ data: streak, incremented: false });
            return;
        }

        streak.currentStreak += 1;
        streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
        await streak.save();

        res.json({ data: streak, incremented: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createStreak = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).session?.user?.id;
        if (!userId) {
            res.status(400).json({ error: "userId es requerido" });
            return
        }
        const streak = await Streak.create({
            userId,
            currentStreak: 0,
            longestStreak: 0,
        });
        res.status(201).json({ data: streak });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const updateStreak = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).session?.user?.id;
        if (!userId) {
            res.status(400).json({ error: "userId es requerido" });
            return
        }
        const streak = await Streak.findOne({ where: { userId } });
        if (!streak) {
            res.status(404).json({ error: "Streak no encontrada" });
            return
        }
        const { currentStreak, longestStreak } = req.body;
        if (typeof currentStreak === "number") streak.currentStreak = currentStreak;
        if (typeof longestStreak === "number") streak.longestStreak = longestStreak;
        await streak.save();
        res.json({ data: streak });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const resetStreak = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).session?.user?.id;
        if (!userId) {
            res.status(400).json({ error: "userId es requerido" });
            return
        }
        const streak = await Streak.findOne({ where: { userId } });
        if (!streak) {
            res.status(404).json({ error: "Streak no encontrada" });
            return
        }
        streak.currentStreak = 0;
        await streak.save();
        res.json({ data: streak });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};