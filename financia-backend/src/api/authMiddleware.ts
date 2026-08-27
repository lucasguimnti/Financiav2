import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Segredo do Token (deve ser o mesmo usado no app.ts)
const JWT_SECRET = 'financia_super_secret_key_2026';

// Estendendo o tipo Request do Express para o TypeScript aceitar o userId
export interface AuthRequest extends Request {
  userId?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Token não fornecido' });
    return;
  }

  // O cabeçalho vem como "Bearer <token>", então separamos pelo espaço
  const [, token] = authHeader.split(' ');

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    // Injetamos o ID do usuário na requisição para a rota poder usar!
    req.userId = decoded.userId; 
    next(); // Deixa a requisição continuar para a rota
  } catch (error) {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};