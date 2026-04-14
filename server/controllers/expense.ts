import { Response } from 'express';
import { Expense } from '../models/Expense';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../middleware/activityLogger';

export const createExpense = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { amount, category, note, date, paymentMethod, isRecurring, frequency, recurringInterval, reminderDays } = req.body;

    if (amount === undefined || amount === null || !category) {
      return res.status(400).json({ error: 'Amount and category are required' });
    }

    const expenseData: any = {
      userId: req.userId,
      amount,
      category,
      note: note || '',
      date: date ? new Date(date) : new Date(),
      paymentMethod: paymentMethod || '',
      source: 'website',
      isRecurring: isRecurring || false,
    };

    // Calculate next date for recurring expenses
    if (isRecurring && frequency) {
      expenseData.frequency = frequency;
      expenseData.recurringInterval = recurringInterval || 1;
      expenseData.reminderDays = reminderDays !== undefined ? reminderDays : 3;
      
      const expenseDate = new Date(date || Date.now());
      const nextDate = new Date(expenseDate);
      const interval = recurringInterval || 1;

      switch (frequency) {
        case 'daily':
          nextDate.setDate(nextDate.getDate() + interval);
          break;
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + (7 * interval));
          break;
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + interval);
          break;
        case 'yearly':
          nextDate.setFullYear(nextDate.getFullYear() + interval);
          break;
      }
      expenseData.nextDate = nextDate;
    }

    const expense = await Expense.create(expenseData);

    await logActivity(req, {
      action: 'CREATE',
      entity: 'expense',
      entityId: expense._id.toString(),
      details: { amount, category, isRecurring },
    });

    return res.status(201).json({ message: 'Expense created', expense });
  } catch (error) {
    console.error('Create expense error:', error);
    return res.status(500).json({ error: 'Failed to create expense' });
  }
};

export const getExpenses = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { category, startDate, endDate, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = { userId: req.userId };
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate as string);
      if (endDate) filter.date.$lte = new Date(endDate as string);
    }

    const expenses = await Expense.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Expense.countDocuments(filter);

    return res.json({
      expenses,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    return res.status(500).json({ error: 'Failed to fetch expenses' });
  }
};

export const updateExpense = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const updates = req.body;

    const expense = await Expense.findOne({ _id: id, userId: req.userId });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Recalculate next date if recurring settings changed
    if (updates.isRecurring && updates.frequency) {
      const expenseDate = new Date(updates.date || expense.date);
      const nextDate = new Date(expenseDate);
      const interval = updates.recurringInterval || 1;

      switch (updates.frequency) {
        case 'daily':
          nextDate.setDate(nextDate.getDate() + interval);
          break;
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + (7 * interval));
          break;
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + interval);
          break;
        case 'yearly':
          nextDate.setFullYear(nextDate.getFullYear() + interval);
          break;
      }
      updates.nextDate = nextDate;
    } else if (updates.isRecurring === false) {
      // Clear recurring fields if isRecurring is set to false
      updates.frequency = undefined;
      updates.recurringInterval = undefined;
      updates.nextDate = undefined;
      updates.reminderDays = undefined;
    }

    Object.assign(expense, updates);
    await expense.save();

    await logActivity(req, {
      action: 'UPDATE',
      entity: 'expense',
      entityId: id,
      details: updates,
    });

    return res.json({ message: 'Expense updated', expense });
  } catch (error) {
    console.error('Update expense error:', error);
    return res.status(500).json({ error: 'Failed to update expense' });
  }
};

export const deleteExpense = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { password } = req.body;

    if (!password || password !== '123') {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const expense = await Expense.findOneAndDelete({ _id: id, userId: req.userId });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    await logActivity(req, {
      action: 'DELETE',
      entity: 'expense',
      entityId: id,
    });

    return res.json({ message: 'Expense deleted' });
  } catch (error) {
    console.error('Delete expense error:', error);
    return res.status(500).json({ error: 'Failed to delete expense' });
  }
};

export const getExpenseStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { category, startDate, endDate } = req.query;

    const filter: any = { userId: req.userId };
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate as string);
      if (endDate) filter.date.$lte = new Date(endDate as string);
    }

    const stats = await Expense.aggregate([
      { $match: filter },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    const totalExpense = stats.reduce((sum, stat) => sum + stat.total, 0);

    return res.json({ stats, total: totalExpense });
  } catch (error) {
    console.error('Get expense stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch expense stats' });
  }
};
