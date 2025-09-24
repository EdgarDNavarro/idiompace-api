import { Request, Response } from 'express';
import Test from "../models/Tests.model";

export const createTest = async (req: Request, res: Response) => {
    try {
        const test = await Test.create(req.body);
        res.status(201).json({data: test});
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const getTests = async (req: Request, res: Response) => {
    try {
        const { storyId } = req.query;
        const where = storyId ? { storyId } : undefined;
        const tests = await Test.findAll({ where });
        res.json({data: tests});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateTest = async (req: Request, res: Response) => {
    try {
        const test = await Test.findByPk(req.params.id);
        if (!test){
            res.status(404).json({ error: "Test not found" });
            return
        }

        await test.update(req.body);
        await test.save();
        res.json({data: test});
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteTest = async (req: Request, res: Response) => {
    try {
        const test = await Test.findByPk(req.params.id);
        if (!test) {
            res.status(404).json({ error: "Test not found" });
            return;
        }
            
        await test.destroy();
        res.send("Test deleted successfully");
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
