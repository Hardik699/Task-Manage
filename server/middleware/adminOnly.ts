import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { User } from '../models/User';

export const adminOnly = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.findById(req.userId);

    if (!user || user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
};
