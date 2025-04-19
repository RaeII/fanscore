import { Router } from 'express';
import jwtMiddleware from '@/middlewares/jwt.middleware';
import walletController from '../controllers/wallet.controller';

const router = Router();

// Rotas sem autenticação
router.post('/signature', walletController.signature.bind(walletController));
router.get('/check/:walletAddress', walletController.checkWalletExists.bind(walletController));

// Rotas com autenticação
router.get('/balance', jwtMiddleware.validJWTNeeded, walletController.balanceOf.bind(walletController));
router.get('/me', jwtMiddleware.validJWTNeeded, walletController.getUserWallet.bind(walletController));

export default router;
