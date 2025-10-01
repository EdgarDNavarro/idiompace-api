import { Request, Response } from "express";
import Daily from "../models/Daily.Model";
import { Op } from "sequelize";
import { paginate } from "../utils/paginate";

// Crear un daily
export const createDaily = async (req: Request, res: Response) => {
    try {
        if(req.body.n8n_auth !== process.env.N8N_AUTH_TOKEN) {
            res.status(403).json({ error: "Unauthorized" });
            return
        }
        const daily = await Daily.create(req.body);
        res.status(201).json({ data: daily });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Traer el daily de hoy
export const getTodayDaily = async (req: Request, res: Response) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const daily = await Daily.findOne({
            where: {
                createdAt: {
                    [Op.gte]: today,
                    [Op.lt]: tomorrow,
                },
            },
        });

        if (!daily) {
            res.status(404).json({ error: "No hay daily para hoy" });
            return
        }
        res.json({ data: daily });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Listar todos los daily
export const listDailies = async (req: Request, res: Response) => {
    try {

        const pagination = (req as any).pagination;

        const result = await paginate(Daily, { order: [["createdAt", "DESC"]] }, pagination);

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};