import { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'

export const handleInputErrors = async (req: Request, res: Response, next: NextFunction) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() })
        return
    }
    next()
}

export interface Pagination {
    page: number;
    limit: number;
    offset: number;
}

export const pagination = (defaultLimit = 10, maxLimit = 50) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        let page = parseInt(req.query.page as string) || 1;
        let limit = parseInt(req.query.limit as string) || defaultLimit;

        if (limit > maxLimit) limit = maxLimit;
        if (page < 1) page = 1;

        const offset = (page - 1) * limit;

        (req as any).pagination = { page, limit, offset };

        next();
    };
};
