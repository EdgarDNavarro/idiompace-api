import { Request, Response } from "express";
import Streak from "../models/Streak.Model";

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