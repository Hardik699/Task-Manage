import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { ActivityLog } from '../models/ActivityLog';

export interface LogActivity {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
  entity: 'task' | 'expense' | 'policy' | 'payment' | 'user';
  entityId?: string;
  details?: any;
}

export const logActivity = async (req: AuthRequest, logData: LogActivity) => {
  try {
    if (!req.userId || !req.username) {
      return;
    }

    const ipAddress = req.ip || '';
    const userAgent = req.get('user-agent') || '';

    await ActivityLog.create({
      userId: req.userId,
      username: req.username,
      action: logData.action,
      entity: logData.entity,
      entityId: logData.entityId,
      details: logData.details || {},
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};
