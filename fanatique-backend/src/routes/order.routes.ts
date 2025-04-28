import express, { Request, Response } from 'express';

import Controller from '@/controllers/Order.controller';
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

router.post('/payment', [
	jwtMiddleware.validJWTNeeded,
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();
		await controller.paymentOrder(req, res);
	}
]);

router.get('/user/list', [
	jwtMiddleware.validJWTNeeded,
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();
		await controller.fetchByUser(req, res);
	}
]);

router.get('', [
	jwtMiddleware.validJWTNeeded,
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();
		await controller.fetchAll(req, res);
	}
]);

router.get('/establishment/:establishmentId', [
	jwtMiddleware.validJWTNeeded,
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();
		await controller.fetchByEstablishment(req, res);
	}
]);

router.get('/match/:matchId', [
	jwtMiddleware.validJWTNeeded,
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();
		await controller.fetchByMatch(req, res);
	}
]);

router.put('/:id', [
	jwtMiddleware.validJWTNeeded,
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();
		await controller.update(req, res);
	}
]);

export default router; 