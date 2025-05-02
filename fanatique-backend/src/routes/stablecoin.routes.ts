import express, { Request, Response } from 'express';

import Controller from '@/controllers/Stablecoin.controller';
import jwtMiddleware from '@/middlewares/jwt.middleware';

const router = express.Router();

router.get('/:id', [
    jwtMiddleware.validJWTNeeded,
    async (req: Request, res: Response): Promise<void> => {
        const controller = new Controller();

        await controller.fetch(req, res);
    }
]);

router.get('', [
    jwtMiddleware.validJWTNeeded,
    async (req: Request, res: Response): Promise<void> => {
        const controller = new Controller();

        await controller.fetchAll(req, res);
    }
]);

export default router; 