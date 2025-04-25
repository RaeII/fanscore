import express, { Request, Response } from 'express';

import Controller from '@/controllers/QuestUser.controller';
import jwtMiddleware from '@/middlewares/jwt.middleware';

const router = express.Router();

router.post('', [
	jwtMiddleware.validJWTNeeded,
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();
		await controller.create(req, res);
	}
]);

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

router.get('/user/:userId', [
	jwtMiddleware.validJWTNeeded,
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();
		await controller.fetchByUser(req, res);
	}
]);

router.get('/quest/:questId', [
	jwtMiddleware.validJWTNeeded,
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();
		await controller.fetchByQuest(req, res);
	}
]);

router.get('/match/:matchId', [
	jwtMiddleware.validJWTNeeded,
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();
		await controller.fetchByMatch(req, res);
	}
]);

router.get('/status', [
	jwtMiddleware.validJWTNeeded,
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();
		await controller.fetchCompletedByUser(req, res);
	}
]);

router.get('/all-quests/user', [
	jwtMiddleware.validJWTNeeded,
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();
		await controller.fetchAllQuestsWithUserCompletion(req, res);
	}
]);

router.put('/:id', [
	jwtMiddleware.validJWTNeeded,
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();
		await controller.update(req, res);
	}
]);

router.put('/complete/:id', [
	jwtMiddleware.validJWTNeeded,
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();
		await controller.completeQuest(req, res);
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