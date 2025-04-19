import express, { Request, Response } from 'express';

import Controller from '@/controllers/UserClub.controller';
import jwtMiddleware from '@/middlewares/jwt.middleware';

const router = express.Router();

router.post('', [
    jwtMiddleware.validJWTNeeded,
    async (req: Request, res: Response): Promise<void> => {
        const controller = new Controller();

        controller.create(req, res);
    }
]);

router.get('', [
    jwtMiddleware.validJWTNeeded,
    async (req: Request, res: Response): Promise<void> => {
        const controller = new Controller();

        await controller.fetch(req, res);
    }
]);

router.get('/all', [
    jwtMiddleware.validJWTNeeded,
    async (req: Request, res: Response): Promise<void> => {
        const controller = new Controller();

        await controller.fetchAll(req, res);
    }
]);

router.put('', [
    jwtMiddleware.validJWTNeeded,
    async (req: Request, res: Response): Promise<void> => {
        const controller = new Controller();

        await controller.update(req, res);
    }
]);

router.delete('/:id', [
    jwtMiddleware.validJWTNeeded,
    async (req: Request, res: Response): Promise<void> => {
        const controller = new Controller();

        await controller.delete(req, res);
    }
]);

export default router; 