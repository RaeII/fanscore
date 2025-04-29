import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Controller from './Controller';

class AuthController extends Controller {
  constructor() {
    super();
  }

  async createJWT(req: Request, res: Response) {
    try {
      const userId = req.body.user_id;
      if (!userId) {
        return this.sendErrorMessage(res, new Error('ID do usuário não fornecido'), 'Dados de autenticação incompletos');
      }

      const jwtSecret = process.env.JWT_SECRET || 'default_secret_key';
      const expiresIn = 60 * 60 * 24 * 30; // 30 dias

      const token = jwt.sign({ user_id: userId }, jwtSecret, { expiresIn });

      return this.sendSuccessResponse(res, {
        content: {
          accessToken: token,
          expiresIn: expiresIn
        }
      });
    } catch (err) {
      return this.sendErrorMessage(res, err, 'Erro ao gerar token de autenticação');
    }
  }
}

export default AuthController; 