import express, { Request, Response } from 'express';

import Controller from '@/controllers/User.controller';
import jwtMiddleware from '@/middlewares/jwt.middleware';

const router = express.Router();

router.post('', [
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
	//jwtMiddleware.validJWTNeeded,
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();

		await controller.fetchAll(req, res);
	}
]);

router.get('/is_unique/username/:username', [
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();

		await controller.fetchIsUsernameUnique(req, res);
	}
]);

router.get('/is_unique/wallet_address/:wallet_address', [
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();

		await controller.fetchIsWalletAddressUnique(req, res);
	}
]);

router.put('', [
	jwtMiddleware.validJWTNeeded,
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();

		await controller.update(req, res);
	}
]);

router.delete('', [
	jwtMiddleware.validJWTNeeded,
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();

		await controller.delete(req, res);
	}
]);

export default router;