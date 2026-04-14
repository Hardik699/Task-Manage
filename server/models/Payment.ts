import mongoose from 'mongoose';

interface IPayment {
  userId: mongoose.Types.ObjectId;
  title: string;
  amount: number;
  category: string;
  dueDate: Date;
  status: 'pending' | 'paid' | 'overdue';
  paidDate?: Date;
  notes: string;
  reminderSentAt?: Date;
  source: 'website' | 'telegram';
  isLoan?: boolean;
  totalLoanAmount?: number;
  paidAmount?: number;
  remainingAmount?: number;
  emiPayments?: Array<{
    date: Date;
    amount: number;
  }>;
  loanDetails?: {
    bankName: string;
    loanType: string;
    principalAmount: number;
    interestRate: number;
    tenure: number;
    tenureUnit: 'months' | 'years';
    emiAmount: number;
    startDate: Date;
    endDate: Date;
    totalInterest: number;
    totalAmount: number;
  };
  attachments?: Array<{
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
    uploadedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new mongoose.Schema<IPayment>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      trim: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue'],
      default: 'pending',
    },
    paidDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    reminderSentAt: {
      type: Date,
    },
    source: {
      type: String,
      enum: ['website', 'telegram'],
      default: 'website',
    },
    isLoan: {
      type: Boolean,
      default: false,
    },
    totalLoanAmount: {
      type: Number,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingAmount: {
      type: Number,
      min: 0,
    },
    emiPayments: [{
      date: Date,
      amount: Number,
    }],
    loanDetails: {
      bankName: String,
      loanType: String,
      principalAmount: Number,
      interestRate: Number,
      tenure: Number,
      tenureUnit: {
        type: String,
        enum: ['months', 'years'],
      },
      emiAmount: Number,
      startDate: Date,
      endDate: Date,
      totalInterest: Number,
      totalAmount: Number,
    },
    attachments: [{
      fileName: String,
      fileType: String,
      fileSize: Number,
      fileUrl: String,
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  {
    timestamps: true,
  }
);

// Index for common queries
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ userId: 1, dueDate: 1 });

export const Payment = (mongoose.models.Payment as mongoose.Model<IPayment> | undefined) ?? mongoose.model<IPayment>('Payment', paymentSchema);
