import { NextFunction, Response } from 'express';
import { AuthRequest } from '../types.js';
import { verifyAccessToken } from '../utils/jwt.js';

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);
    req.user = { userId: payload.userId };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
