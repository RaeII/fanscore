import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

class JwtMiddleware {
  validJWTNeeded(req: Request, res: Response, next: NextFunction): void {
    if (req.headers['authorization']) {
      try {

        const authorization = req.headers['authorization'].split(' ');
        if (authorization[0] !== 'Bearer') {
          res.status(401).send({
            status: 'ERROR',
            message: 'Token de autenticação inválido'
          });
          return;
        } else {
          const jwtSecret = process.env.JWT_SECRET || 'default_secret_key';
          
          // Verificar o token
          const decoded = jwt.verify(authorization[1], jwtSecret);
          res.locals.jwt = decoded;
          next();
        }
      } catch (err) {

        res.status(403).send({
          status: 'ERROR',
          message: 'Token expirado ou inválido'
        });
      }
    } else {
      res.status(401).send({
        status: 'ERROR',
        message: 'Token de autenticação não fornecido'
      });
    }
  }
}

export default new JwtMiddleware(); 