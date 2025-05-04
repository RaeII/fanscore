import express, { Request, Response } from 'express';
import jwtMiddleware from '@/middlewares/jwt.middleware';
import walletController from '../controllers/wallet.controller';

const router = express.Router();

// Rotas sem autenticação
router.post('/signature', [
  async (req: Request, res: Response): Promise<void> => {
    await walletController.signature(req, res);
  }
]);

router.get('/check/:walletAddress', [
  async (req: Request, res: Response): Promise<void> => {
    await walletController.checkWalletExists(req, res);
  }
]);

// // Rotas com autenticação
// router.get('/balance', [
//     jwtMiddleware.validJWTNeeded,
//     async (req: Request, res: Response) => {
//         return walletController.balanceOf(req, res);
//     }
// ]);

// router.get('/me', [
//     jwtMiddleware.validJWTNeeded,
//     async (req: Request, res: Response) => {
//         return walletController.getUserWallet(req, res);
//     }
// ]);

export default router;
