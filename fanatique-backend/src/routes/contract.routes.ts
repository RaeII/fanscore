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

export default router; 