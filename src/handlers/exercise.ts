import { Request, Response } from "express";
import Exercise from "../models/Exercise.Model";

// Crear ejercicio
export const createExercise = async (req: Request, res: Response) => {
    try {
        const exercise = await Exercise.create(req.body);
        res.status(201).json({ data: exercise });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Listar ejercicios (puedes filtrar por storyId)
export const getExercises = async (req: Request, res: Response) => {
    try {
        const { storyId } = req.query;
        const where = storyId ? { storyId } : undefined;
        const exercises = await Exercise.findAll({ where });
        res.json({ data: exercises });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Actualizar ejercicio
export const updateExercise = async (req: Request, res: Response) => {
    try {
        const exercise = await Exercise.findByPk(req.params.id);
        if (!exercise) {
            res.status(404).json({ error: "Exercise not found" });
            return;
        }
        await exercise.update(req.body);
        await exercise.save();
        res.json({ data: exercise });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Eliminar ejercicio
export const deleteExercise = async (req: Request, res: Response) => {
    try {
        const exercise = await Exercise.findByPk(req.params.id);
        if (!exercise) {
            res.status(404).json({ error: "Exercise not found" });
            return;
        }
        await exercise.destroy();
        res.send("Exercise deleted successfully");
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};