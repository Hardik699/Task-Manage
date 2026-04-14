import { RequestHandler } from 'express';
import Income from '../models/Income';
import { AuthRequest } from '../middleware/auth';

// Get all income
export const getAllIncome: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { type, category, startDate, endDate } = req.query;
    const filter: any = { userId };

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate as string);
      if (endDate) filter.date.$lte = new Date(endDate as string);
    }

    const incomes = await Income.find(filter).sort({ date: -1 });
    res.json({ incomes });
  } catch (error: any) {
    console.error('Error fetching income:', error);
    res.status(500).json({ error: 'Failed to fetch income' });
  }
};

// Get income statistics
export const getIncomeStats: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Total income
    const totalIncome = await Income.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // Income by category
    const byCategory = await Income.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Income by type
    const byType = await Income.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Monthly income (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyIncome = await Income.aggregate([
      {
        $match: {
          userId,
          date: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      totalIncome: totalIncome[0]?.total || 0,
      byCategory,
      byType,
      monthlyIncome,
    });
  } catch (error: any) {
    console.error('Error fetching income stats:', error);
    res.status(500).json({ error: 'Failed to fetch income statistics' });
  }
};

// Create income
export const createIncome: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { title, amount, category, source, type, frequency, date, description, tags } = req.body;

    if (!title || !amount || !source || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const incomeData: any = {
      userId,
      title,
      amount,
      category: category || 'Other',
      source,
      type,
      date: date || new Date(),
      description,
      tags,
    };

    // Calculate next date for recurring income
    if (type === 'recurring' && frequency) {
      incomeData.frequency = frequency;
      const incomeDate = new Date(date || Date.now());
      const nextDate = new Date(incomeDate);

      switch (frequency) {
        case 'daily':
          nextDate.setDate(nextDate.getDate() + 1);
          break;
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case 'yearly':
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
      }
      incomeData.nextDate = nextDate;
    }

    const income = await Income.create(incomeData);
    res.status(201).json({ income });
  } catch (error: any) {
    console.error('Error creating income:', error);
    res.status(500).json({ error: 'Failed to create income' });
  }
};

// Update income
export const updateIncome: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const updates = req.body;

    // Recalculate next date if type or frequency changed
    if (updates.type === 'recurring' && updates.frequency) {
      const incomeDate = new Date(updates.date || Date.now());
      const nextDate = new Date(incomeDate);

      switch (updates.frequency) {
        case 'daily':
          nextDate.setDate(nextDate.getDate() + 1);
          break;
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case 'yearly':
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
      }
      updates.nextDate = nextDate;
    }

    const income = await Income.findOneAndUpdate(
      { _id: id, userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!income) {
      return res.status(404).json({ error: 'Income not found' });
    }

    res.json({ income });
  } catch (error: any) {
    console.error('Error updating income:', error);
    res.status(500).json({ error: 'Failed to update income' });
  }
};

// Delete income
export const deleteIncome: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { password } = req.body;

    // Verify password
    if (password !== '123') {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const income = await Income.findOneAndDelete({ _id: id, userId });

    if (!income) {
      return res.status(404).json({ error: 'Income not found' });
    }

    res.json({ message: 'Income deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting income:', error);
    res.status(500).json({ error: 'Failed to delete income' });
  }
};

// Upload attachment
export const uploadAttachment: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { filename, data, mimeType } = req.body;

    if (!filename || !data || !mimeType) {
      return res.status(400).json({ error: 'Missing file data' });
    }

    const income = await Income.findOne({ _id: id, userId });
    if (!income) {
      return res.status(404).json({ error: 'Income not found' });
    }

    if (!income.attachments) {
      income.attachments = [];
    }

    income.attachments.push({
      filename,
      data,
      mimeType,
      uploadedAt: new Date(),
    });

    await income.save();
    res.json({ income });
  } catch (error: any) {
    console.error('Error uploading attachment:', error);
    res.status(500).json({ error: 'Failed to upload attachment' });
  }
};

// Delete attachment
export const deleteAttachment: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id, attachmentId } = req.params;

    const income = await Income.findOne({ _id: id, userId });
    if (!income) {
      return res.status(404).json({ error: 'Income not found' });
    }

    if (income.attachments) {
      income.attachments = income.attachments.filter(
        (att: any) => att._id?.toString() !== attachmentId
      );
      await income.save();
    }

    res.json({ income });
  } catch (error: any) {
    console.error('Error deleting attachment:', error);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
};
