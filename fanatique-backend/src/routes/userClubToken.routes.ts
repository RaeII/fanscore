import express, { Request, Response } from 'express';

import Controller from '@/controllers/UserClubToken.controller';
import jwtMiddleware from '@/middlewares/jwt.middleware';

const router = express.Router();

// Rota para buscar todos os tokens do usuário
router.get('', [
  jwtMiddleware.validJWTNeeded,
  async (req: Request, res: Response): Promise<void> => {
    const controller = new Controller();
    await controller.fetchAllByUser(req, res);
  }
]);

// Rota para buscar tokens específicos de um clube
router.get('/club/:club_id', [
  jwtMiddleware.validJWTNeeded,
  async (req: Request, res: Response): Promise<void> => {
    const controller = new Controller();
    await controller.fetchByUserAndClub(req, res);
  }
]);

// Rota para verificar se um usuário pode receber tokens
router.get('/can-receive/:club_id', [
  jwtMiddleware.validJWTNeeded,
  async (req: Request, res: Response): Promise<void> => {
    const controller = new Controller();
    await controller.canReceiveTokens(req, res);
  }
]);

export default router; 