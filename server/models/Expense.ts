import mongoose from 'mongoose';

interface IExpense {
  userId: mongoose.Types.ObjectId;
  amount: number;
  category: string;
  note: string;
  date: Date;
  paymentMethod: string;
  source: 'website' | 'telegram';
  isRecurring?: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurringInterval?: number; // For monthly: 1, 3, 6, 12 months
  nextDate?: Date;
  reminderDays?: number; // Days before nextDate to send reminder
  attachments?: Array<{
    fileName: string;
    fileType: string;
    fileSize: number;
    fileData: string; // Base64 encoded file data
    uploadedAt: Date;
  }>;
  createdAt: Date;
}

const expenseSchema = new mongoose.Schema<IExpense>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    note: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      enum: ['website', 'telegram'],
      default: 'website',
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
    },
    recurringInterval: {
      type: Number,
      default: 1,
      min: 1,
    },
    nextDate: {
      type: Date,
    },
    reminderDays: {
      type: Number,
      default: 3,
      min: 0,
    },
    attachments: [
      {
        fileName: {
          type: String,
          required: true,
        },
        fileType: {
          type: String,
          required: true,
        },
        fileSize: {
          type: Number,
          required: true,
        },
        fileData: {
          type: String,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for common queries
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, category: 1 });
expenseSchema.index({ userId: 1, isRecurring: 1 });

export const Expense = (mongoose.models.Expense as mongoose.Model<IExpense> | undefined) ?? mongoose.model<IExpense>('Expense', expenseSchema);
