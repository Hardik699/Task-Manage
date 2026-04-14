import { Response } from 'express';
import { Payment } from '../models/Payment';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../middleware/activityLogger';

export const createPayment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { title, amount, category, dueDate, notes, isLoan, totalLoanAmount, loanDetails } = req.body;

    if (!title || amount === undefined || amount === null || !dueDate) {
      return res.status(400).json({ error: 'Title, amount, and due date are required' });
    }

    let processedLoanDetails = undefined;
    if (isLoan && loanDetails) {
      const { principalAmount, interestRate, tenure, tenureUnit } = loanDetails;
      
      // Calculate EMI
      const monthlyRate = interestRate / 12 / 100;
      const totalMonths = tenureUnit === 'years' ? tenure * 12 : tenure;
      const emiAmount = principalAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
      const totalAmount = emiAmount * totalMonths;
      const totalInterest = totalAmount - principalAmount;
      
      const startDate = new Date(loanDetails.startDate);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + totalMonths);

      processedLoanDetails = {
        bankName: loanDetails.bankName,
        loanType: loanDetails.loanType,
        principalAmount,
        interestRate,
        tenure,
        tenureUnit,
        emiAmount: Math.round(emiAmount * 100) / 100,
        startDate,
        endDate,
        totalInterest: Math.round(totalInterest * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
      };
    }

    const payment = await Payment.create({
      userId: req.userId,
      title,
      amount,
      category: category || 'General',
      dueDate: new Date(dueDate),
      status: 'pending',
      notes: notes || '',
      source: 'website',
      isLoan: isLoan || false,
      totalLoanAmount: isLoan ? totalLoanAmount : undefined,
      paidAmount: 0,
      remainingAmount: isLoan ? totalLoanAmount : undefined,
      emiPayments: [],
      loanDetails: processedLoanDetails,
    });

    await logActivity(req, {
      action: 'CREATE',
      entity: 'payment',
      entityId: payment._id.toString(),
      details: { title, amount, isLoan },
    });

    return res.status(201).json({ message: 'Payment created', payment });
  } catch (error) {
    console.error('Create payment error:', error);
    return res.status(500).json({ error: 'Failed to create payment' });
  }
};

export const getPayments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { status, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = { userId: req.userId };
    if (status) filter.status = status;

    const payments = await Payment.find(filter)
      .sort({ dueDate: 1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Payment.countDocuments(filter);

    return res.json({
      payments,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get payments error:', error);
    return res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

export const updatePayment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const updates = req.body;

    const payment = await Payment.findOne({ _id: id, userId: req.userId });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    Object.assign(payment, updates);
    await payment.save();

    await logActivity(req, {
      action: 'UPDATE',
      entity: 'payment',
      entityId: id,
      details: updates,
    });

    return res.json({ message: 'Payment updated', payment });
  } catch (error) {
    console.error('Update payment error:', error);
    return res.status(500).json({ error: 'Failed to update payment' });
  }
};

export const deletePayment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { password } = req.body;

    if (!password || password !== '123') {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const payment = await Payment.findOneAndDelete({ _id: id, userId: req.userId });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    await logActivity(req, {
      action: 'DELETE',
      entity: 'payment',
      entityId: id,
    });

    return res.json({ message: 'Payment deleted' });
  } catch (error) {
    console.error('Delete payment error:', error);
    return res.status(500).json({ error: 'Failed to delete payment' });
  }
};

export const markAsPaid = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;

    const payment = await Payment.findOne({ _id: id, userId: req.userId });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    payment.status = 'paid';
    payment.paidDate = new Date();
    await payment.save();

    await logActivity(req, {
      action: 'UPDATE',
      entity: 'payment',
      entityId: id,
      details: { status: 'paid' },
    });

    return res.json({ message: 'Payment marked as paid', payment });
  } catch (error) {
    console.error('Mark as paid error:', error);
    return res.status(500).json({ error: 'Failed to mark payment as paid' });
  }
};

export const getOverduePayments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const overduePayments = await Payment.find({
      userId: req.userId,
      status: 'pending',
      dueDate: { $lte: twoDaysAgo },
    }).sort({ dueDate: 1 });

    return res.json({
      overduePayments,
      count: overduePayments.length,
    });
  } catch (error) {
    console.error('Get overdue payments error:', error);
    return res.status(500).json({ error: 'Failed to fetch overdue payments' });
  }
};

export const addEmiPayment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { amount, date } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const payment = await Payment.findOne({ _id: id, userId: req.userId });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (!payment.isLoan) {
      return res.status(400).json({ error: 'This is not a loan payment' });
    }

    // Add EMI payment
    if (!payment.emiPayments) {
      payment.emiPayments = [];
    }

    payment.emiPayments.push({
      date: new Date(date || new Date()),
      amount,
    });

    // Update paid and remaining amounts
    payment.paidAmount = (payment.paidAmount || 0) + amount;
    payment.remainingAmount = (payment.totalLoanAmount || 0) - payment.paidAmount;

    // Mark as paid if fully paid
    if (payment.remainingAmount <= 0) {
      payment.status = 'paid';
      payment.paidDate = new Date();
      payment.remainingAmount = 0;
    }

    await payment.save();

    await logActivity(req, {
      action: 'UPDATE',
      entity: 'payment',
      entityId: id,
      details: { emiPayment: amount, remainingAmount: payment.remainingAmount },
    });

    return res.json({ message: 'EMI payment added', payment });
  } catch (error) {
    console.error('Add EMI payment error:', error);
    return res.status(500).json({ error: 'Failed to add EMI payment' });
  }
};

export const updateEmiPayment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id, emiIndex } = req.params;
    const { amount, date } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const payment = await Payment.findOne({ _id: id, userId: req.userId });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (!payment.isLoan || !payment.emiPayments || !payment.emiPayments[emiIndex]) {
      return res.status(400).json({ error: 'EMI payment not found' });
    }

    const oldAmount = payment.emiPayments[emiIndex].amount;
    payment.emiPayments[emiIndex] = {
      date: new Date(date),
      amount,
    };

    // Recalculate paid and remaining amounts
    const totalPaid = payment.emiPayments.reduce((sum, emi) => sum + emi.amount, 0);
    payment.paidAmount = totalPaid;
    payment.remainingAmount = (payment.totalLoanAmount || 0) - totalPaid;

    // Mark as paid if fully paid
    if (payment.remainingAmount <= 0) {
      payment.status = 'paid';
      payment.paidDate = new Date();
      payment.remainingAmount = 0;
    } else if (payment.status === 'paid') {
      payment.status = 'pending';
      payment.paidDate = undefined;
    }

    await payment.save();

    await logActivity(req, {
      action: 'UPDATE',
      entity: 'payment',
      entityId: id,
      details: { emiUpdate: { oldAmount, newAmount: amount }, remainingAmount: payment.remainingAmount },
    });

    return res.json({ message: 'EMI payment updated', payment });
  } catch (error) {
    console.error('Update EMI payment error:', error);
    return res.status(500).json({ error: 'Failed to update EMI payment' });
  }
};

export const deleteEmiPayment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id, emiIndex } = req.params;

    const payment = await Payment.findOne({ _id: id, userId: req.userId });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (!payment.isLoan || !payment.emiPayments || !payment.emiPayments[emiIndex]) {
      return res.status(400).json({ error: 'EMI payment not found' });
    }

    const deletedAmount = payment.emiPayments[emiIndex].amount;
    payment.emiPayments.splice(emiIndex, 1);

    // Recalculate paid and remaining amounts
    const totalPaid = payment.emiPayments.reduce((sum, emi) => sum + emi.amount, 0);
    payment.paidAmount = totalPaid;
    payment.remainingAmount = (payment.totalLoanAmount || 0) - totalPaid;

    // Update status if needed
    if (payment.status === 'paid' && payment.remainingAmount > 0) {
      payment.status = 'pending';
      payment.paidDate = undefined;
    }

    await payment.save();

    await logActivity(req, {
      action: 'UPDATE',
      entity: 'payment',
      entityId: id,
      details: { emiDeleted: deletedAmount, remainingAmount: payment.remainingAmount },
    });

    return res.json({ message: 'EMI payment deleted', payment });
  } catch (error) {
    console.error('Delete EMI payment error:', error);
    return res.status(500).json({ error: 'Failed to delete EMI payment' });
  }
};

export const uploadAttachment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { fileName, fileType, fileSize, fileData } = req.body;

    if (!fileName || !fileType || !fileData) {
      return res.status(400).json({ error: 'File data is required' });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(fileType)) {
      return res.status(400).json({ error: 'Only images (JPEG, PNG, GIF) and PDF files are allowed' });
    }

    // Validate file size (max 5MB)
    if (fileSize > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size must be less than 5MB' });
    }

    const payment = await Payment.findOne({ _id: id, userId: req.userId });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Initialize attachments array if not exists
    if (!payment.attachments) {
      payment.attachments = [];
    }

    // Add attachment (store base64 data directly for now)
    payment.attachments.push({
      fileName,
      fileType,
      fileSize,
      fileUrl: fileData, // Base64 data URL
      uploadedAt: new Date(),
    });

    await payment.save();

    await logActivity(req, {
      action: 'UPDATE',
      entity: 'payment',
      entityId: id,
      details: { attachmentAdded: fileName },
    });

    return res.json({ message: 'Attachment uploaded successfully', payment });
  } catch (error) {
    console.error('Upload attachment error:', error);
    return res.status(500).json({ error: 'Failed to upload attachment' });
  }
};

export const deleteAttachment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id, attachmentIndex } = req.params;

    const payment = await Payment.findOne({ _id: id, userId: req.userId });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (!payment.attachments || !payment.attachments[attachmentIndex]) {
      return res.status(400).json({ error: 'Attachment not found' });
    }

    const deletedFileName = payment.attachments[attachmentIndex].fileName;
    payment.attachments.splice(parseInt(attachmentIndex), 1);

    await payment.save();

    await logActivity(req, {
      action: 'UPDATE',
      entity: 'payment',
      entityId: id,
      details: { attachmentDeleted: deletedFileName },
    });

    return res.json({ message: 'Attachment deleted successfully', payment });
  } catch (error) {
    console.error('Delete attachment error:', error);
    return res.status(500).json({ error: 'Failed to delete attachment' });
  }
};
