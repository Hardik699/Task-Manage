import { Response } from 'express';
import { User } from '../models/User';
import { ActivityLog } from '../models/ActivityLog';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../middleware/activityLogger';

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const users = await User.find()
      .select('-passwordHash')
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments();

    return res.json({
      users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('Get user by ID error:', error);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
};

export const getActivityLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, action, entity, startDate, endDate, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = {};
    if (userId) filter.userId = userId;
    if (action) filter.action = action;
    if (entity) filter.entity = entity;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    const logs = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await ActivityLog.countDocuments(filter);

    return res.json({
      logs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    return res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
};

export const getUserLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const logs = await ActivityLog.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await ActivityLog.countDocuments({ userId });

    return res.json({
      logs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get user logs error:', error);
    return res.status(500).json({ error: 'Failed to fetch user logs' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    // Prevent deleting self
    if (userId === req.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await logActivity(req, {
      action: 'DELETE',
      entity: 'user',
      entityId: userId,
      details: { username: user.username },
    });

    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
};

export const impersonateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await logActivity(req, {
      action: 'UPDATE',
      entity: 'user',
      entityId: userId,
      details: { action: 'impersonated', username: user.username },
    });

    return res.json({
      message: 'Impersonation session started',
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Impersonate user error:', error);
    return res.status(500).json({ error: 'Failed to impersonate user' });
  }
};

export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate role
    if (!['user', 'superadmin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be "user" or "superadmin"' });
    }

    // Prevent changing own role
    if (userId === req.userId) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await logActivity(req, {
      action: 'UPDATE',
      entity: 'user',
      entityId: userId,
      details: { 
        action: 'role_updated',
        username: user.username,
        newRole: role 
      },
    });

    return res.json({ 
      message: `User role updated to ${role} successfully`,
      user 
    });
  } catch (error) {
    console.error('Update user role error:', error);
    return res.status(500).json({ error: 'Failed to update user role' });
  }
};

export const getAdminStats = async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const superAdmins = await User.countDocuments({ role: 'superadmin' });
    const recentLogs = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(5);

    return res.json({
      stats: {
        totalUsers,
        superAdmins,
        regularUsers: totalUsers - superAdmins,
      },
      recentLogs,
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
};
