import express, { Request, Response } from 'express';

import Controller from '@/controllers/Quest.controller';
import jwtMiddleware from '@/middlewares/jwt.middleware';

const router = express.Router();

router.post('', [
	//jwtMiddleware.validJWTNeeded,
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();
		await controller.create(req, res);
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

router.get('/type/:typeId', [
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();
		await controller.fetchByType(req, res);
	}
]);

router.get('/scope/:scopeId', [
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();
		await controller.fetchByScope(req, res);
	}
]);

router.get('/types/all', [
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();
		await controller.fetchQuestTypes(req, res);
	}
]);

router.get('/scopes/all', [
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();
		await controller.fetchQuestScopes(req, res);
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