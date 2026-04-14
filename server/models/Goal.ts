import mongoose from 'mongoose';

interface IGoal {
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  category: 'business' | 'education' | 'travel' | 'home' | 'vehicle' | 'other';
  deadline?: Date;
  status: 'active' | 'completed' | 'abandoned';
  investmentType?: 'sip' | 'fd' | 'rd' | 'ppf' | 'nps' | 'stocks' | 'mutual_fund' | 'savings' | 'other';
  monthlyContribution?: number;
  interestRate?: number;
  maturityDate?: Date;
  reminderDay?: number; // Day of month for reminder (1-31)
  fundName?: string; // For SIP/Mutual Funds - e.g., "HDFC Top 100"
  savings: Array<{
    date: Date;
    amount: number;
    type: 'sip' | 'fd' | 'rd' | 'ppf' | 'nps' | 'stocks' | 'mutual_fund' | 'savings' | 'other';
    fundName?: string; // Track which fund this saving went to
    note?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const goalSchema = new mongoose.Schema<IGoal>(
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
    description: {
      type: String,
      trim: true,
    },
    targetAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    category: {
      type: String,
      enum: ['business', 'education', 'travel', 'home', 'vehicle', 'other'],
      default: 'other',
    },
    deadline: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'abandoned'],
      default: 'active',
    },
    investmentType: {
      type: String,
      enum: ['sip', 'fd', 'rd', 'ppf', 'nps', 'stocks', 'mutual_fund', 'savings', 'other'],
    },
    monthlyContribution: {
      type: Number,
      min: 0,
    },
    interestRate: {
      type: Number,
      min: 0,
      max: 100,
    },
    maturityDate: {
      type: Date,
    },
    reminderDay: {
      type: Number,
      min: 1,
      max: 31,
    },
    fundName: {
      type: String,
      trim: true,
    },
    savings: [{
      date: Date,
      amount: Number,
      type: {
        type: String,
        enum: ['sip', 'fd', 'rd', 'ppf', 'nps', 'stocks', 'mutual_fund', 'savings', 'other'],
      },
      fundName: String,
      note: String,
    }],
  },
  {
    timestamps: true,
  }
);

// Index for common queries
goalSchema.index({ userId: 1, status: 1 });
goalSchema.index({ userId: 1, category: 1 });

export const Goal = (mongoose.models.Goal as mongoose.Model<IGoal> | undefined) ?? mongoose.model<IGoal>('Goal', goalSchema);
