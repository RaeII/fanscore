import express, { Request, Response } from 'express';

import Controller from '@/controllers/Match.controller';
import jwtMiddleware from '@/middlewares/jwt.middleware';

const router = express.Router();

router.post('', [
	//jwtMiddleware.validJWTNeeded,
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();
		await controller.create(req, res);
	}
]);

router.get('/club/:clubId', [
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();
		await controller.fetchByClubId(req, res);
	}
]);

router.get('/stadium/:stadiumId', [
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();
		await controller.fetchByStadiumId(req, res);
	}
]);

router.get('/:id', [
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();
		await controller.fetch(req, res);
	}
]);

router.get('', [
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();
		await controller.fetchAll(req, res);
	}
]);

router.put('/:id', [
	//jwtMiddleware.validJWTNeeded,
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();
		await controller.update(req, res);
	}
]);

router.delete('/:id', [
	//jwtMiddleware.validJWTNeeded,
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();
		await controller.delete(req, res);
	}
]);

export default router; 