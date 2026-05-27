import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET: string = process.env.JWT_SECRET || 'smzdm-default-secret-2024';

export interface AuthRequest extends Request {
  userId?: string;
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, SECRET, { expiresIn: '30d' });
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: '未登录' });
    return;
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Token 无效或已过期' });
  }
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], SECRET) as { userId: string };
      req.userId = decoded.userId;
    } catch {
      // ignore invalid token
    }
  }
  next();
}