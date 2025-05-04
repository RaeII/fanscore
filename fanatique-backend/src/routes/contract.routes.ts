import express, { Request, Response } from 'express';

import Controller from '@/controllers/Contract.controller';
import jwtMiddleware from '@/middlewares/jwt.middleware';

const router = express.Router();

router.post('/all-club-tokens', [
	jwtMiddleware.validJWTNeeded,
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();

		controller.configureAllClubTokens(req, res);
	}
]);

router.post('/transfer-tokens', [
	jwtMiddleware.validJWTNeeded,
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();

		controller.transferTokensToUser(req, res);
	}
]);

router.post('/transfer-stablecoins', [
	jwtMiddleware.validJWTNeeded,
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();

		controller.transferStablecoinsToUser(req, res);
	}
]);

router.get('/wallet-tokens/:wallet_address', [
	jwtMiddleware.validJWTNeeded,
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();

		controller.getWalletTokens(req, res);
	}
]);

router.get('/wallet-tokens/:wallet_address/club/:club_id', [
	jwtMiddleware.validJWTNeeded,
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();

		controller.getWalletTokenByClub(req, res);
	}
]);

router.get('/stablecoin-balances/:wallet_address', [
	jwtMiddleware.validJWTNeeded,
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();

		controller.getStablecoinBalances(req, res);
	}
]);

router.get('/stablecoin-balance/:wallet_address/stablecoin/:stablecoin_id', [
	jwtMiddleware.validJWTNeeded,
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();

		controller.getStablecoinBalance(req, res);
	}
]);

router.post('/pay-with-stablecoin', [
	jwtMiddleware.validJWTNeeded,
	async (req: Request, res: Response): Promise<void> => {
		const controller = new Controller();

		controller.payWithStablecoin(req, res);
	}
]);

export default router; 