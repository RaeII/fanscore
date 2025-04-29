import { Request, Response } from 'express';

import { getErrorMessage, getSuccessMessage } from '@/helpers/response_collection';
import Controller from './Controller';
import UserClubTokenService from '@/services/UserClubToken.service';
import Database from '@/database/Database';

class UserClubTokenController extends Controller {
  private service: UserClubTokenService;

  constructor() {
    super();
    this.service = new UserClubTokenService();
  }

  /**
   * Retorna todos os registros de tokens de clubes para um usuário
   */
  async fetchAllByUser(req: Request, res: Response) {
    try {
      const userId: number = Number(res.locals.jwt.user_id);
      const tokens = await this.service.fetchAllByUser(userId);
      return this.sendSuccessResponse(res, { content: tokens });
    } catch (err) {
      this.sendErrorMessage(res, err, 'Erro ao buscar tokens do usuário');
    }
  }

  /**
   * Retorna um registro específico de tokens para um usuário e clube
   */
  async fetchByUserAndClub(req: Request, res: Response) {
    try {
      const userId: number = Number(res.locals.jwt.user_id);
      const clubId: number = Number(req.params.club_id);
      
      if (!clubId) throw Error(getErrorMessage('missingField', 'ID do clube'));
      
      const token = await this.service.fetchByUserAndClub(userId, clubId);
      if (!token) {
        return this.sendSuccessResponse(res, { 
          content: {
            user_id: userId,
            club_id: clubId,
            total: 0
          }
        });
      }
      
      return this.sendSuccessResponse(res, { content: token });
    } catch (err) {
      this.sendErrorMessage(res, err, 'Erro ao buscar tokens do clube');
    }
  }

  /**
   * Verifica se um usuário pode receber uma quantidade específica de tokens
   */
  async canReceiveTokens(req: Request, res: Response) {
    try {
      const userId: number = Number(res.locals.jwt.user_id);
      const clubId: number = Number(req.params.club_id);
      const amount: number = Number(req.query.amount);
      
      if (!clubId) throw Error(getErrorMessage('missingField', 'ID do clube'));
      if (!amount) throw Error(getErrorMessage('missingField', 'Quantidade de tokens'));
      
      const result = await this.service.canReceiveTokens(userId, clubId, amount);
      return this.sendSuccessResponse(res, { content: result });
    } catch (err) {
      this.sendErrorMessage(res, err, 'Erro ao verificar disponibilidade de tokens');
    }
  }
}

export default UserClubTokenController; 