import { Response } from 'express';
import { Policy } from '../models/Policy';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../middleware/activityLogger';

// Helper function to calculate next payment date
const calculateNextPaymentDate = (lastPaymentDate: Date, frequency: string): Date => {
  const nextDate = new Date(lastPaymentDate);
  
  switch (frequency) {
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'half-yearly':
      nextDate.setMonth(nextDate.getMonth() + 6);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    case 'one-time':
      // No next payment for one-time
      return lastPaymentDate;
    default:
      nextDate.setMonth(nextDate.getMonth() + 1);
  }
  
  return nextDate;
};

export const createPolicy = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const policyData = {
      ...req.body,
      userId: req.userId,
      nextPaymentDate: req.body.nextPaymentDate || req.body.startDate,
    };

    const policy = await Policy.create(policyData);

    await logActivity(req, {
      action: 'CREATE',
      entity: 'policy',
      entityId: policy._id.toString(),
      details: { name: policy.name, type: policy.type },
    });

    return res.status(201).json({ message: 'Policy created', policy });
  } catch (error) {
    console.error('Create policy error:', error);
    return res.status(500).json({ error: 'Failed to create policy' });
  }
};

export const getPolicies = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { status, type, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = { userId: req.userId };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const policies = await Policy.find(filter)
      .sort({ nextPaymentDate: 1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Policy.countDocuments(filter);

    return res.json({
      policies,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get policies error:', error);
    return res.status(500).json({ error: 'Failed to fetch policies' });
  }
};

export const getPolicyById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const policy = await Policy.findOne({ _id: id, userId: req.userId });

    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    return res.json({ policy });
  } catch (error) {
    console.error('Get policy error:', error);
    return res.status(500).json({ error: 'Failed to fetch policy' });
  }
};

export const updatePolicy = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const updates = req.body;

    const policy = await Policy.findOne({ _id: id, userId: req.userId });

    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    Object.assign(policy, updates);
    await policy.save();

    await logActivity(req, {
      action: 'UPDATE',
      entity: 'policy',
      entityId: id,
      details: updates,
    });

    return res.json({ message: 'Policy updated', policy });
  } catch (error) {
    console.error('Update policy error:', error);
    return res.status(500).json({ error: 'Failed to update policy' });
  }
};

export const deletePolicy = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { password } = req.body;

    if (!password || password !== '123') {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const policy = await Policy.findOneAndDelete({ _id: id, userId: req.userId });

    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    await logActivity(req, {
      action: 'DELETE',
      entity: 'policy',
      entityId: id,
    });

    return res.json({ message: 'Policy deleted' });
  } catch (error) {
    console.error('Delete policy error:', error);
    return res.status(500).json({ error: 'Failed to delete policy' });
  }
};

export const logPayment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { amount, date, receiptNumber, note } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const policy = await Policy.findOne({ _id: id, userId: req.userId });

    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    // Add payment to history
    policy.paymentHistory.push({
      date: date ? new Date(date) : new Date(),
      amount,
      receiptNumber,
      note,
    });

    // Update total paid amount
    policy.totalPaidAmount += amount;

    // Calculate next payment date
    if (policy.premiumFrequency !== 'one-time') {
      const lastPaymentDate = date ? new Date(date) : new Date();
      policy.nextPaymentDate = calculateNextPaymentDate(lastPaymentDate, policy.premiumFrequency);
    }

    await policy.save();

    await logActivity(req, {
      action: 'UPDATE',
      entity: 'policy',
      entityId: id,
      details: { payment: amount, nextPaymentDate: policy.nextPaymentDate },
    });

    return res.json({ message: 'Payment logged successfully', policy });
  } catch (error) {
    console.error('Log payment error:', error);
    return res.status(500).json({ error: 'Failed to log payment' });
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Total active policies
    const totalActive = await Policy.countDocuments({
      userId: req.userId,
      status: 'active',
    });

    // Calculate total annual premium
    const policies = await Policy.find({ userId: req.userId, status: 'active' });
    let totalAnnualPremium = 0;
    
    policies.forEach(policy => {
      let annualAmount = policy.premiumAmount;
      switch (policy.premiumFrequency) {
        case 'monthly':
          annualAmount *= 12;
          break;
        case 'quarterly':
          annualAmount *= 4;
          break;
        case 'half-yearly':
          annualAmount *= 2;
          break;
        case 'yearly':
          annualAmount *= 1;
          break;
      }
      totalAnnualPremium += annualAmount;
    });

    // Expiring this month
    const expiringThisMonth = await Policy.countDocuments({
      userId: req.userId,
      status: 'active',
      endDate: { $gte: now, $lte: endOfMonth },
    });

    // Upcoming payments (next 30 days)
    const upcomingPayments = await Policy.countDocuments({
      userId: req.userId,
      status: 'active',
      nextPaymentDate: { $gte: now, $lte: thirtyDaysFromNow },
    });

    return res.json({
      totalActive,
      totalAnnualPremium: Math.round(totalAnnualPremium),
      expiringThisMonth,
      upcomingPayments,
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

export const getUpcomingPolicies = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Policies with payments due in next 30 days
    const upcomingPayments = await Policy.find({
      userId: req.userId,
      status: 'active',
      nextPaymentDate: { $gte: now, $lte: thirtyDaysFromNow },
    }).sort({ nextPaymentDate: 1 });

    // Policies expiring in next 30 days
    const expiringPolicies = await Policy.find({
      userId: req.userId,
      status: 'active',
      endDate: { $gte: now, $lte: thirtyDaysFromNow },
    }).sort({ endDate: 1 });

    // Overdue payments
    const overduePayments = await Policy.find({
      userId: req.userId,
      status: 'active',
      nextPaymentDate: { $lt: now },
    }).sort({ nextPaymentDate: 1 });

    return res.json({
      upcomingPayments,
      expiringPolicies,
      overduePayments,
    });
  } catch (error) {
    console.error('Get upcoming policies error:', error);
    return res.status(500).json({ error: 'Failed to fetch upcoming policies' });
  }
};
