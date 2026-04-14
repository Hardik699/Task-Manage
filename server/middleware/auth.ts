import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
  username?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.accessToken || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
    req.userId = decoded.userId;
    req.username = decoded.username;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const generateAccessToken = (userId: string, username: string) => {
  return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '15m' });
};

export const generateRefreshToken = (userId: string, username: string) => {
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-key-change-in-production';
  return jwt.sign({ userId, username }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

export const verifyRefreshToken = (token: string) => {
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-key-change-in-production';
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string; username: string };
  } catch {
    return null;
  }
};
