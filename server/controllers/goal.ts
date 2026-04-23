import { Response } from 'express';
import { Goal } from '../models/Goal';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../middleware/activityLogger';

export const createGoal = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { title, description, targetAmount, category, deadline } = req.body;

    if (!title || !targetAmount) {
      return res.status(400).json({ error: 'Title and target amount are required' });
    }

    const goal = await Goal.create({
      userId: req.userId,
      title,
      description: description || '',
      targetAmount,
      currentAmount: 0,
      category: category || 'other',
      deadline: deadline ? new Date(deadline) : undefined,
      status: 'active',
      savings: [],
    });

    await logActivity(req, {
      action: 'CREATE',
      entity: 'goal',
      entityId: goal._id.toString(),
      details: { title, targetAmount },
    });

    return res.status(201).json({ message: 'Goal created', goal });
  } catch (error) {
    console.error('Create goal error:', error);
    return res.status(500).json({ error: 'Failed to create goal' });
  }
};

export const getGoals = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { status, category, page = 1, limit = 1000 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = { userId: req.userId };
    if (status) filter.status = status;
    if (category) filter.category = category;

    const goals = await Goal.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Goal.countDocuments(filter);

    return res.json({
      goals,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get goals error:', error);
    return res.status(500).json({ error: 'Failed to fetch goals' });
  }
};

export const updateGoal = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const updates = req.body;

    const goal = await Goal.findOne({ _id: id, userId: req.userId });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    Object.assign(goal, updates);

    // Auto-complete if target reached
    if (goal.currentAmount >= goal.targetAmount && goal.status === 'active') {
      goal.status = 'completed';
    }

    await goal.save();

    await logActivity(req, {
      action: 'UPDATE',
      entity: 'goal',
      entityId: id,
      details: updates,
    });

    return res.json({ message: 'Goal updated', goal });
  } catch (error) {
    console.error('Update goal error:', error);
    return res.status(500).json({ error: 'Failed to update goal' });
  }
};

export const addSaving = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { amount, type, note, date } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const goal = await Goal.findOne({ _id: id, userId: req.userId });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Add saving entry
    goal.savings.push({
      date: new Date(date || new Date()),
      amount,
      type: type || 'savings',
      note: note || '',
    });

    // Update current amount
    goal.currentAmount += amount;

    // Auto-complete if target reached
    if (goal.currentAmount >= goal.targetAmount && goal.status === 'active') {
      goal.status = 'completed';
    }

    await goal.save();

    await logActivity(req, {
      action: 'UPDATE',
      entity: 'goal',
      entityId: id,
      details: { savingAdded: amount, currentAmount: goal.currentAmount },
    });

    return res.json({ message: 'Saving added', goal });
  } catch (error) {
    console.error('Add saving error:', error);
    return res.status(500).json({ error: 'Failed to add saving' });
  }
};

export const deleteGoal = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { password } = req.body;

    if (!password || password !== '123') {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const goal = await Goal.findOneAndDelete({ _id: id, userId: req.userId });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    await logActivity(req, {
      action: 'DELETE',
      entity: 'goal',
      entityId: id,
    });

    return res.json({ message: 'Goal deleted' });
  } catch (error) {
    console.error('Delete goal error:', error);
    return res.status(500).json({ error: 'Failed to delete goal' });
  }
};
