import express, { Request, Response } from 'express';

import Controller from '@/controllers/Transaction.controller';
import jwtMiddleware from '@/middlewares/jwt.middleware';

const router = express.Router();

router.get('/:id', [
	jwtMiddleware.validJWTNeeded,
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();

		controller.fetch(req, res);
	}
]);

router.get('/user/all', [
	jwtMiddleware.validJWTNeeded,
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();

		controller.fetchByUser(req, res);
	}
]);

router.get('/all', [
	jwtMiddleware.validJWTNeeded,
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();

		controller.fetchAll(req, res);
	}
]);

export default router; 